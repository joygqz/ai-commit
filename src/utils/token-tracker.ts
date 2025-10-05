import type { StatusBarItem } from 'vscode'
import type { TokenUsage } from './openai'
import { l10n, QuickPickItemKind, StatusBarAlignment, window } from 'vscode'
import { EXTENSION_NAME } from './constants'

interface Stats {
  totalTokens: number
  promptTokens: number
  completionTokens: number
  cachedTokens: number
  cacheHitRate: string
  avgTokens: number
  overallCacheRate: string
}

/**
 * Token 跟踪器
 * 负责跟踪和显示 API token 使用情况
 */
class TokenTracker {
  private statusBarItem: StatusBarItem | null = null
  private lastUsage: TokenUsage | null = null
  private totalTokens = 0
  private totalCachedTokens = 0
  private requestCount = 0

  /**
   * 初始化状态栏
   */
  initialize(): StatusBarItem {
    if (!this.statusBarItem) {
      this.statusBarItem = window.createStatusBarItem(StatusBarAlignment.Right, 100)
      this.statusBarItem.command = 'commitGenie.showTokenStats'
      this.statusBarItem.text = `$(sparkle) ${EXTENSION_NAME}`
      this.statusBarItem.tooltip = l10n.t('Click to view Token usage statistics')
      this.statusBarItem.show()
    }
    return this.statusBarItem
  }

  /**
   * 更新使用统计
   */
  updateUsage(usage: TokenUsage): void {
    this.lastUsage = usage
    this.totalTokens += usage.totalTokens
    this.totalCachedTokens += usage.cachedTokens || 0
    this.requestCount++
  }

  /**
   * 显示详细统计
   */
  showDetailedStats(): void {
    const stats = this.calculateStats()

    if (!stats) {
      window.showInformationMessage(l10n.t('No Token usage records'))
      return
    }

    const items = [
      { label: `${l10n.t('Current Request')}`, kind: QuickPickItemKind.Separator },
      { label: l10n.t('Total: {0} token', stats.totalTokens), detail: l10n.t('Total tokens used in this request') },
      { label: l10n.t('Prompt: {0} token', stats.promptTokens), detail: l10n.t('Tokens in the prompt sent to AI') },
      { label: l10n.t('Completion: {0} token', stats.completionTokens), detail: l10n.t('Tokens in the AI response') },
      ...(stats.cachedTokens > 0
        ? [{ label: l10n.t('Cache: {0}%', stats.cacheHitRate), detail: l10n.t('Prompt cache used, saving costs') }]
        : []),
      { label: `${l10n.t('Cumulative Statistics')}`, kind: QuickPickItemKind.Separator },
      { label: l10n.t('Requests: {0} count', this.requestCount), detail: l10n.t('Total API calls made') },
      { label: l10n.t('Total: {0} token', this.totalTokens), detail: l10n.t('Total tokens used') },
      { label: l10n.t('Average: {0} token/request', stats.avgTokens), detail: l10n.t('Average tokens per request') },
      { label: l10n.t('Cache: {0}%', stats.overallCacheRate), detail: l10n.t('Cumulative cache hit rate') },
    ]

    window.showQuickPick(items, {
      title: l10n.t('Token Usage Statistics'),
      placeHolder: l10n.t('Press ESC to close'),
    })
  }

  /**
   * 重置统计
   */
  reset(): void {
    this.lastUsage = null
    this.totalTokens = 0
    this.totalCachedTokens = 0
    this.requestCount = 0
  }

  /**
   * 清理资源
   */
  dispose(): void {
    this.statusBarItem?.dispose()
    this.statusBarItem = null
  }

  /**
   * 计算统计数据
   */
  private calculateStats(): Stats | null {
    if (!this.lastUsage) {
      return null
    }

    const { totalTokens, promptTokens, completionTokens, cachedTokens = 0 } = this.lastUsage

    return {
      totalTokens,
      promptTokens,
      completionTokens,
      cachedTokens,
      cacheHitRate: cachedTokens > 0 ? ((cachedTokens / promptTokens) * 100).toFixed(0) : '0',
      avgTokens: Math.round(this.totalTokens / this.requestCount),
      overallCacheRate: this.totalTokens > 0 ? ((this.totalCachedTokens / this.totalTokens) * 100).toFixed(1) : '0',
    }
  }
}

export const tokenTracker = new TokenTracker()
