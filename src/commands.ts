import type { ChatCompletionMessageParam } from 'openai/resources'
import type { ExtensionContext } from 'vscode'
import { ConfigurationTarget, l10n, window } from 'vscode'
import { logger, ProgressHandler, validateConfig } from './utils'
import { config } from './utils/config'
import { getUserFriendlyErrorMessage, shouldSilenceError } from './utils/error-handler'
import { getDiffStaged, getRepo } from './utils/git'
import { ChatGPTStreamAPI, showModels } from './utils/openai'
import { generateCommitMessageChatCompletionPrompt } from './utils/prompts'

/**
 * 当前活动的中止控制器
 */
let abortController: AbortController | null = null

/**
 * 生成 commit 消息命令
 * @param context 扩展上下文
 */
async function generateCommitMessage(context: ExtensionContext) {
  if (abortController) {
    abortController?.abort()
  }

  const controller = new AbortController()
  abortController = controller

  try {
    logger.info('Starting commit message generation')

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

    // 生成并调用 API
    const messagePrompts = await generateCommitMessageChatCompletionPrompt(diff)
    logger.info('Calling OpenAI API')

    await ProgressHandler.withProgress(
      '',
      async (progress, token) => {
        progress.report({ message: l10n.t('Generating commit message...') })

        token?.onCancellationRequested(() => {
          controller.abort()
        })

        scmInputBox.value = ''
        await ChatGPTStreamAPI(
          messagePrompts as ChatCompletionMessageParam[],
          (chunk: string) => {
            if (!controller.signal.aborted) {
              scmInputBox.value += chunk
            }
          },
          { signal: controller.signal },
        )

        if (!controller.signal.aborted) {
          logger.info('Commit message generated successfully')
        }
      },
      true,
    )
  }
  catch (error: unknown) {
    if (shouldSilenceError(error)) {
      return
    }

    logger.error('Failed to generate commit message', error)
    window.showErrorMessage(getUserFriendlyErrorMessage(error))
  }
  finally {
    if (abortController === controller) {
      abortController = null
    }
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
    const models = await showModels()

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
export { generateCommitMessage, selectAvailableModel }
