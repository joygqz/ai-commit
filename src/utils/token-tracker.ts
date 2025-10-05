import type { ExtensionContext, StatusBarItem } from 'vscode'
import type { TokenUsage } from './openai'
import { l10n, StatusBarAlignment, window } from 'vscode'
import { COMMANDS, EXTENSION_NAME } from './constants'
import { logger } from './logger'

/**
 * 当前会话统计数据（可能包含多个 API 请求）
 */
export interface CurrentStats {
  totalTokens: number
  promptTokens: number
  completionTokens: number
  cachedTokens: number
  cacheHitRate: string
}

/**
 * 历史累计统计数据
 */
export interface HistoricalStats {
  operationCount: number
  totalTokens: number
  avgTokens: number
  overallCacheRate: string
}

/**
 * 持久化存储的数据结构
 */
interface PersistedData {
  version: number
  totalTokens: number
  totalPromptTokens: number
  totalCachedTokens: number
  operationCount: number
}

/**
 * 当前数据版本号
 */
const DATA_VERSION = 2

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
  private currentSessionStats: CurrentStats | null = null
  private totalTokens = 0
  private totalPromptTokens = 0
  private totalCachedTokens = 0
  private operationCount = 0
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
      if (typeof data.totalPromptTokens === 'number' && data.totalPromptTokens >= 0) {
        this.totalPromptTokens = data.totalPromptTokens
      }
      if (typeof data.totalCachedTokens === 'number' && data.totalCachedTokens >= 0) {
        this.totalCachedTokens = data.totalCachedTokens
      }
      if (typeof data.operationCount === 'number' && data.operationCount >= 0) {
        this.operationCount = data.operationCount
      }

      logger.debug('Loaded token tracker data', {
        totalTokens: this.totalTokens,
        operationCount: this.operationCount,
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
        totalPromptTokens: this.totalPromptTokens,
        totalCachedTokens: this.totalCachedTokens,
        operationCount: this.operationCount,
      }

      await this.context.globalState.update(STORAGE_KEY, data)
      logger.debug('Saved token tracker data', {
        totalTokens: this.totalTokens,
        operationCount: this.operationCount,
      })
    }
    catch (error) {
      logger.error('Failed to save token tracker data', error)
      throw error
    }
  }

  /**
   * 开始一个新会话（通常在一个完整操作开始时调用）
   */
  startSession(): void {
    this.currentSessionStats = {
      totalTokens: 0,
      promptTokens: 0,
      completionTokens: 0,
      cachedTokens: 0,
      cacheHitRate: '0.0',
    }
  }

  /**
   * 结束当前会话
   */
  endSession(): void {
    // 会话结束后，将当前会话的统计作为"最后一次请求"的数据
    if (this.currentSessionStats) {
      this.lastUsage = {
        totalTokens: this.currentSessionStats.totalTokens,
        promptTokens: this.currentSessionStats.promptTokens,
        completionTokens: this.currentSessionStats.completionTokens,
        cachedTokens: this.currentSessionStats.cachedTokens,
      }
      // 操作完成，增加操作计数
      this.operationCount++
      // 保存数据
      this.savePersistedData().catch(() => {})
    }
    this.currentSessionStats = null
  }

  /**
   * 更新使用统计
   */
  updateUsage(usage: TokenUsage): void {
    // 如果有活动会话，累加到会话统计中
    if (this.currentSessionStats) {
      this.currentSessionStats.totalTokens += usage.totalTokens
      this.currentSessionStats.promptTokens += usage.promptTokens
      this.currentSessionStats.completionTokens += usage.completionTokens
      this.currentSessionStats.cachedTokens += usage.cachedTokens || 0

      // 重新计算缓存命中率
      const cachedTokens = this.currentSessionStats.cachedTokens
      const promptTokens = this.currentSessionStats.promptTokens
      this.currentSessionStats.cacheHitRate = cachedTokens > 0 && promptTokens > 0
        ? ((cachedTokens / promptTokens) * 100).toFixed(1)
        : '0.0'
    }
    else {
      // 如果没有活动会话，直接记录为最后一次使用
      this.lastUsage = usage
    }

    // 累加到总统计
    this.totalTokens += usage.totalTokens
    this.totalPromptTokens += usage.promptTokens
    this.totalCachedTokens += usage.cachedTokens || 0

    // 错误已在 savePersistedData 中记录，这里静默处理不影响主流程继续执行
    this.savePersistedData().catch(() => {})
  }

  /**
   * 获取当前会话或最后一次请求的统计数据
   * @returns 当前统计，如果没有则返回 null
   */
  getCurrentStats(): CurrentStats | null {
    // 优先返回当前活动会话的统计
    if (this.currentSessionStats) {
      return this.currentSessionStats
    }

    // 否则返回最后一次请求的统计
    if (!this.lastUsage) {
      return null
    }

    const { totalTokens, promptTokens, completionTokens, cachedTokens = 0 } = this.lastUsage
    const cacheHitRate = cachedTokens > 0 && promptTokens > 0
      ? ((cachedTokens / promptTokens) * 100).toFixed(1)
      : '0.0'

    return {
      totalTokens,
      promptTokens,
      completionTokens,
      cachedTokens,
      cacheHitRate,
    }
  }

  /**
   * 获取历史累计统计数据
   * @returns 历史统计，如果没有则返回 null
   */
  getHistoricalStats(): HistoricalStats | null {
    if (this.operationCount === 0) {
      return null
    }

    const avgTokens = Math.round(this.totalTokens / this.operationCount)
    // 缓存命中率计算：缓存的 token 数 / 总 prompt token 数
    // 因为缓存只针对 prompt tokens，不包括 completion tokens
    const overallCacheRate = this.totalPromptTokens > 0
      ? ((this.totalCachedTokens / this.totalPromptTokens) * 100).toFixed(1)
      : '0'

    return {
      operationCount: this.operationCount,
      totalTokens: this.totalTokens,
      avgTokens,
      overallCacheRate,
    }
  }

  /**
   * 重置所有统计数据
   */
  async reset(): Promise<void> {
    this.lastUsage = null
    this.currentSessionStats = null
    this.totalTokens = 0
    this.totalPromptTokens = 0
    this.totalCachedTokens = 0
    this.operationCount = 0

    await this.savePersistedData()
    logger.info('Token tracker data reset')
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
}

export const tokenTracker = new TokenTracker()
