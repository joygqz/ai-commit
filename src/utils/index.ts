import type { Progress } from 'vscode'
import { ProgressLocation, window } from 'vscode'
import { config } from './config'

// 重新导出常用模块
export * from './error-handler'
export * from './logger'

export class ProgressHandler {
  /**
   * 在进度通知中执行异步任务
   * @param title 进度标题
   * @param task 要执行的异步任务，接收 progress 对象和 cancellation token
   * @param cancellable 是否允许用户取消操作
   * @returns 任务的返回值
   */
  static async withProgress<T>(
    title: string,
    task: (progress: Progress<{ message?: string, increment?: number }>, token?: { isCancellationRequested: boolean, onCancellationRequested: (callback: () => void) => void }) => Promise<T>,
    cancellable = false,
  ): Promise<T> {
    return window.withProgress(
      {
        location: ProgressLocation.Notification,
        title: `${title}`,
        cancellable,
      },
      (progress, token) => task(progress, token),
    )
  }
}

/**
 * 验证配置项是否存在且非空
 * @param rules 验证规则数组，每项包含 key（配置键）、required（是否必需）和 errorMessage（错误消息）
 * @returns 验证结果，包含 isValid（是否通过）和 error（错误消息）
 */
export function validateConfig(
  rules: Array<{ key: string, required: boolean, errorMessage: string }>,
): { isValid: boolean, error?: string } {
  for (const rule of rules) {
    if (!rule.required) {
      continue
    }

    const value = config.get(rule.key)
    if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
      return {
        isValid: false,
        error: rule.errorMessage,
      }
    }
  }

  return { isValid: true }
}
