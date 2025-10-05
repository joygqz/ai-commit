import type { ExtensionContext, StatusBarItem } from 'vscode'
import type { TokenUsage } from './openai'
import { l10n, QuickPickItemKind, StatusBarAlignment, window } from 'vscode'
import { COMMANDS, EXTENSION_NAME } from './constants'
import { logger } from './logger'

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
 * 持久化存储的数据结构
 */
interface PersistedData {
  version: number
  totalTokens: number
  totalCachedTokens: number
  requestCount: number
}

/**
 * 当前数据版本号
 */
const DATA_VERSION = 1

/**
 * 存储键名
 */
const STORAGE_KEY = 'tokenTrackerData'

/**
 * Token 跟踪器
 */
class TokenTracker {
  private statusBarItem: StatusBarItem | null = null
  private lastUsage: TokenUsage | null = null
  private totalTokens = 0
  private totalCachedTokens = 0
  private requestCount = 0
  private context: ExtensionContext | null = null

  /**
   * 初始化状态栏并加载持久化数据
   * @param context 扩展上下文，用于持久化存储
   */
  initialize(context: ExtensionContext): StatusBarItem {
    this.context = context

    // 加载持久化数据
    this.loadPersistedData()

    if (!this.statusBarItem) {
      this.statusBarItem = window.createStatusBarItem(StatusBarAlignment.Right, 100)
      this.statusBarItem.command = COMMANDS.SHOW_TOKEN_STATS
      this.statusBarItem.text = `$(sparkle) ${EXTENSION_NAME}`
      this.statusBarItem.tooltip = l10n.t('Click to view Token usage statistics')
      this.statusBarItem.show()
    }
    return this.statusBarItem
  }

  /**
   * 加载持久化数据
   */
  private loadPersistedData(): void {
    if (!this.context) {
      return
    }

    try {
      const data = this.context.globalState.get<PersistedData>(STORAGE_KEY)
      if (!data) {
        return
      }

      // 验证数据版本
      if (data.version !== DATA_VERSION) {
        logger.warn('Token tracker data version mismatch, resetting data', {
          expected: DATA_VERSION,
          actual: data.version,
        })
        return
      }

      // 验证数据完整性和类型
      if (typeof data.totalTokens === 'number' && data.totalTokens >= 0) {
        this.totalTokens = data.totalTokens
      }
      if (typeof data.totalCachedTokens === 'number' && data.totalCachedTokens >= 0) {
        this.totalCachedTokens = data.totalCachedTokens
      }
      if (typeof data.requestCount === 'number' && data.requestCount >= 0) {
        this.requestCount = data.requestCount
      }

      logger.debug('Loaded token tracker data', {
        totalTokens: this.totalTokens,
        requestCount: this.requestCount,
      })
    }
    catch (error) {
      logger.error('Failed to load token tracker data', error)
    }
  }

  /**
   * 保存持久化数据
   */
  private async savePersistedData(): Promise<void> {
    if (!this.context) {
      return
    }

    try {
      const data: PersistedData = {
        version: DATA_VERSION,
        totalTokens: this.totalTokens,
        totalCachedTokens: this.totalCachedTokens,
        requestCount: this.requestCount,
      }

      await this.context.globalState.update(STORAGE_KEY, data)
      logger.debug('Saved token tracker data', {
        totalTokens: this.totalTokens,
        requestCount: this.requestCount,
      })
    }
    catch (error) {
      logger.error('Failed to save token tracker data', error)
      throw error
    }
  }

  /**
   * 更新使用统计
   */
  updateUsage(usage: TokenUsage): void {
    this.lastUsage = usage
    this.totalTokens += usage.totalTokens
    this.totalCachedTokens += usage.cachedTokens || 0
    this.requestCount++

    // 错误已在 savePersistedData 中记录，这里静默处理不影响主流程继续执行
    this.savePersistedData().catch(() => {})
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
   * 重置统计（带确认）
   */
  async resetWithConfirmation(): Promise<void> {
    const confirmed = await window.showWarningMessage(
      l10n.t('Are you sure you want to reset all Token usage statistics?'),
      { modal: true },
      l10n.t('Reset'),
    )

    if (confirmed) {
      await this.reset()
      window.showInformationMessage(l10n.t('Token usage statistics have been reset'))
    }
  }

  /**
   * 重置统计
   */
  async reset(): Promise<void> {
    this.lastUsage = null
    this.totalTokens = 0
    this.totalCachedTokens = 0
    this.requestCount = 0

    // 清除持久化数据
    await this.savePersistedData()
  }

  /**
   * 在扩展停用前调用此方法以确保所有数据已持久化
   */
  async ensureSaved(): Promise<void> {
    try {
      await this.savePersistedData()
      logger.info('Token tracker data saved on deactivate')
    }
    catch (error) {
      logger.error('Failed to save token tracker data on deactivate', error)
    }
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
      cacheHitRate: cachedTokens > 0 && promptTokens > 0 ? ((cachedTokens / promptTokens) * 100).toFixed(0) : '0',
      avgTokens: this.requestCount > 0 ? Math.round(this.totalTokens / this.requestCount) : 0,
      overallCacheRate: this.totalTokens > 0 ? ((this.totalCachedTokens / this.totalTokens) * 100).toFixed(1) : '0',
    }
  }
}

export const tokenTracker = new TokenTracker()
