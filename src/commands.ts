import type { ChatCompletionMessageParam } from 'openai/resources'
import type { ExtensionContext } from 'vscode'
import type { CodeReviewResult } from './prompts/review'
import { ConfigurationTarget, l10n, window } from 'vscode'
import { generateCommitMessageChatCompletionPrompt } from './prompts/commit'
import { generateCodeReviewPrompt } from './prompts/review'
import { logger, ProgressHandler, validateConfig } from './utils'
import { config } from './utils/config'
import { getUserFriendlyErrorMessage, shouldSilenceError } from './utils/error-handler'
import { getDiffStaged, getRepo } from './utils/git'
import { ChatGPTAPI, ChatGPTStreamAPI, showModels } from './utils/openai'

/**
 * 当前活动的中止控制器
 */
let abortController: AbortController | null = null

/**
 * 执行代码 review
 * @param diff Git diff 内容
 * @param signal 中止信号
 * @param mode 审查模式
 * @returns Code review 结果
 */
async function performCodeReview(
  diff: string,
  signal: AbortSignal,
  mode: 'off' | 'lenient' | 'standard' | 'strict' = 'standard',
): Promise<CodeReviewResult> {
  logger.info('Starting code review', { mode })

  const reviewPrompts = await generateCodeReviewPrompt(diff, mode)
  const reviewResponse = await ChatGPTAPI(
    reviewPrompts as ChatCompletionMessageParam[],
    { signal },
  )

  logger.debug('Code review response received', { response: reviewResponse })

  try {
    // 尝试解析 JSON 响应
    let jsonStr = reviewResponse.trim()

    // 移除 markdown 代码块标记
    if (jsonStr.includes('```')) {
      const startIdx = jsonStr.indexOf('{')
      const endIdx = jsonStr.lastIndexOf('}')
      if (startIdx !== -1 && endIdx !== -1) {
        jsonStr = jsonStr.slice(startIdx, endIdx + 1)
      }
    }

    const result = JSON.parse(jsonStr) as CodeReviewResult
    logger.info('Code review completed', { passed: result.passed, severity: result.severity, issuesCount: result.issues.length })
    return result
  }
  catch (error) {
    logger.error('Failed to parse code review response', error)
    // 如果解析失败，返回一个默认的通过结果
    return {
      passed: true,
      severity: 'info',
      issues: [],
      suggestions: [],
    }
  }
}

/**
 * 显示代码 review 结果并询问用户是否继续
 * @param review Code review 结果
 * @returns 用户是否选择继续
 */
async function showReviewResultAndAskToContinue(review: CodeReviewResult): Promise<boolean> {
  if (review.passed) {
    logger.info('Code review passed')
    return true
  }

  // 构建消息内容
  const issuesText = review.issues.length > 0
    ? `\n\n${l10n.t('Issues found:')}\n${review.issues.map((issue, index) => `${index + 1}. ${issue}`).join('\n')}`
    : ''

  const suggestionsText = review.suggestions.length > 0
    ? `\n\n${l10n.t('Suggestions:')}\n${review.suggestions.map((suggestion, index) => `${index + 1}. ${suggestion}`).join('\n')}`
    : ''

  // 根据严重程度生成标题
  const title = review.severity === 'error'
    ? l10n.t('❌ Code review found errors')
    : l10n.t('⚠️ Code review found warnings')

  const message = `${title}${issuesText}${suggestionsText}`
  const continueButton = l10n.t('Continue anyway')

  const choice = await window.showWarningMessage(
    message,
    { modal: true },
    continueButton,
  )

  return choice === continueButton
}

/**
 * 审查代码并生成 commit 消息命令
 * @param context 扩展上下文
 */
async function reviewAndCommit(context: ExtensionContext) {
  if (abortController) {
    abortController?.abort()
  }

  const controller = new AbortController()
  abortController = controller

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

    // 第一步：执行代码 review（如果未关闭）
    if (reviewMode !== 'off') {
      let reviewResult: CodeReviewResult
      await ProgressHandler.withProgress(
        '',
        async (progress, token) => {
          progress.report({ message: l10n.t('Reviewing code changes...') })

          token?.onCancellationRequested(() => {
            controller.abort()
          })

          reviewResult = await performCodeReview(diff, controller.signal, reviewMode)
        },
        true,
      )

      // 如果 review 不通过，询问用户是否继续
      if (!reviewResult!.passed) {
        const shouldContinue = await showReviewResultAndAskToContinue(reviewResult!)
        if (!shouldContinue) {
          logger.info('User cancelled commit after review')
          return
        }
      }
    }
    else {
      logger.info('Code review is disabled (mode: off)')
    }

    // 第二步：生成 commit 消息
    const messagePrompts = await generateCommitMessageChatCompletionPrompt(diff)
    logger.info('Calling OpenAI API for commit message generation')

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

    logger.error('Failed to complete review and commit workflow', error)
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
export { reviewAndCommit, selectAvailableModel }
