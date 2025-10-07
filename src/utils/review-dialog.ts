import type { CodeReviewResult } from '../prompts'
import { l10n, window } from 'vscode'
import { logger } from './logger'

/**
 * 显示代码 review 结果并询问用户是否继续
 * @param review Code review 结果
 * @returns 用户是否选择继续
 */
export async function showReviewResultAndAskToContinue(review: CodeReviewResult): Promise<boolean> {
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
    ? `❌ ${l10n.t('Code review found errors')}`
    : review.severity === 'warning'
      ? `⚠️ ${l10n.t('Code review found warnings')}`
      : `ℹ️ ${l10n.t('Code review found suggestions')}`

  const message = `${title}${issuesText}${suggestionsText}`
  const continueButton = l10n.t('Continue anyway')

  const choice = await window.showWarningMessage(
    message,
    { modal: true },
    continueButton,
  )

  return choice === continueButton
}
