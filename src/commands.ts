import type { ExtensionContext } from 'vscode'
import { ConfigurationTarget, l10n, window } from 'vscode'
import { CommitMessageService } from './service/commit'
import { ReviewService } from './service/review'
import { AbortManager } from './utils/abort-manager'
import { config } from './utils/config'
import { getUserFriendlyErrorMessage, shouldSilenceError } from './utils/error-handler'
import { getDiffStaged, getRepo } from './utils/git'
import { logger, ProgressHandler, validateConfig } from './utils/index'
import { getAvailableModels } from './utils/openai'
import { showReviewResultAndAskToContinue } from './utils/review-dialog'

/**
 * AbortController 管理器实例
 */
const abortManager = new AbortManager()

/**
 * 审查代码并生成 commit 消息命令
 * @param context 扩展上下文
 */
async function reviewAndCommit(context: ExtensionContext) {
  const controller = abortManager.createController()

  try {
    logger.info('Starting review and commit workflow')

    // 验证配置
    const validation = validateConfig([
      { key: 'service.apiKey', required: true, errorMessage: l10n.t('API Key is required. Please configure it in settings.') },
      { key: 'service.baseURL', required: true, errorMessage: l10n.t('Base URL is required. Please configure it in settings.') },
      { key: 'service.model', required: true, errorMessage: l10n.t('Model is required. Please configure it in settings.') },
    ])
    if (!validation.isValid) {
      logger.warn('Configuration validation failed', { error: validation.error })
      window.showErrorMessage(validation.error!)
      return
    }

    // 获取暂存区的 diff
    const repo = await getRepo(context)
    const diff = await getDiffStaged(repo)
    if (!diff || diff === l10n.t('No staged changes.')) {
      logger.info('No staged changes found')
      window.showInformationMessage(l10n.t('No staged changes to commit.'))
      return
    }

    logger.debug('Retrieved staged changes', { diffLength: diff.length })

    // 获取 SCM 输入框
    const scmInputBox = repo?.inputBox
    if (!scmInputBox) {
      throw new Error(l10n.t('Unable to find SCM input box.'))
    }

    // 获取 review 配置
    const reviewConfig = config.getReviewConfig()
    const reviewMode = reviewConfig.mode

    // 执行代码 review
    if (reviewMode !== 'off') {
      const reviewResult = await ProgressHandler.withProgress(
        '',
        async (progress, token) => {
          progress.report({ message: l10n.t('Reviewing code changes...') })

          token?.onCancellationRequested(() => {
            controller.abort()
          })

          return await ReviewService.performCodeReview(diff, controller.signal, reviewMode)
        },
        true,
      )

      // 如果 review 不通过，询问用户是否继续
      if (!reviewResult.passed) {
        const shouldContinue = await showReviewResultAndAskToContinue(reviewResult)
        if (!shouldContinue) {
          logger.info('User cancelled commit after review')
          return
        }
      }
    }
    else {
      logger.info('Code review is disabled (mode: off)')
    }

    // 生成 commit 消息
    await ProgressHandler.withProgress(
      '',
      async (progress, token) => {
        progress.report({ message: l10n.t('Generating commit message...') })

        token?.onCancellationRequested(() => {
          controller.abort()
        })

        await CommitMessageService.generateCommitMessage(
          diff,
          scmInputBox,
          controller.signal,
        )
      },
      true,
    )
  }
  catch (error: unknown) {
    if (shouldSilenceError(error)) {
      return
    }

    logger.error('Failed to complete review and commit workflow', error)
    window.showErrorMessage(getUserFriendlyErrorMessage(error))
  }
  finally {
    abortManager.clear(controller)
  }
}

/**
 * 选择可用模型命令
 */
async function selectAvailableModel() {
  try {
    logger.info('Fetching available models')

    // 验证 API 配置
    const validation = validateConfig([
      {
        key: 'service.apiKey',
        required: true,
        errorMessage: l10n.t('API Key is required. Please configure it in settings.'),
      },
      {
        key: 'service.baseURL',
        required: true,
        errorMessage: l10n.t('Base URL is required. Please configure it in settings.'),
      },
    ])
    if (!validation.isValid) {
      window.showErrorMessage(validation.error!)
      return
    }

    // 从 API 获取可用模型列表
    const models = await getAvailableModels()

    logger.debug('Retrieved models', { count: models.length, models })

    if (!models.length) {
      logger.warn('No models available')
      window.showWarningMessage(l10n.t('No models available from current API configuration.'))
      return
    }

    // 获取当前配置的模型
    const currentModel = config.get<string>('service.model')

    // 构建快速选择列表项
    const items = models.map(model => ({
      label: model,
      description: model === currentModel ? l10n.t('Current') : undefined,
    }))

    // 显示模型选择列表
    const picked = await window.showQuickPick(items, {
      title: l10n.t('Select Model'),
      placeHolder: l10n.t('Please select a model to generate commit messages.'),
      matchOnDescription: true,
    })

    if (!picked) {
      return
    }

    // 更新模型配置
    await config.update('service.model', picked.label, ConfigurationTarget.Global)
    logger.info('Model updated', { model: picked.label })
    window.showInformationMessage(l10n.t('Model updated to {0}.', picked.label))
  }
  catch (error: unknown) {
    logger.error('Failed to select model', error)
    const message = getUserFriendlyErrorMessage(error)
    window.showErrorMessage(message)
  }
}

// 导出命令函数供扩展入口文件使用
export { reviewAndCommit, selectAvailableModel }
