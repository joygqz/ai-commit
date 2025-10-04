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
 * 配置验证规则接口
 */
export interface ValidationRule {
  /** 配置键名 */
  key: string
  /** 是否必需 */
  required?: boolean
  /** 最小长度 */
  minLength?: number
  /** 最大长度 */
  maxLength?: number
  /** 正则表达式验证 */
  pattern?: RegExp
  /** 自定义验证函数 */
  custom?: (value: any) => boolean
  /** 验证失败时的错误消息 */
  errorMessage: string
}

/**
 * 配置验证结果接口
 */
export interface ValidationResult {
  /** 是否验证通过 */
  isValid: boolean
  /** 第一个错误消息（如果有） */
  error?: string
  /** 所有错误消息数组（如果有） */
  errors?: string[]
}

/**
 * 验证配置项
 * @param rules 验证规则数组
 * @returns 验证结果，包含是否通过和错误信息
 */
export function validateConfig(rules: ValidationRule[]): ValidationResult {
  const errors: string[] = []

  for (const rule of rules) {
    const value = config.get(rule.key)

    // Required check
    if (rule.required) {
      if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
        errors.push(rule.errorMessage)
        continue
      }
    }

    // Skip other validations if value is empty and not required
    if (value === undefined || value === null || value === '') {
      continue
    }

    const strValue = String(value)

    // Min length check
    if (rule.minLength !== undefined && strValue.length < rule.minLength) {
      errors.push(rule.errorMessage)
      continue
    }

    // Max length check
    if (rule.maxLength !== undefined && strValue.length > rule.maxLength) {
      errors.push(rule.errorMessage)
      continue
    }

    // Pattern check
    if (rule.pattern && !rule.pattern.test(strValue)) {
      errors.push(rule.errorMessage)
      continue
    }

    // Custom validation
    if (rule.custom && !rule.custom(value)) {
      errors.push(rule.errorMessage)
      continue
    }
  }

  if (errors.length > 0) {
    return {
      isValid: false,
      error: errors[0],
      errors,
    }
  }

  return { isValid: true }
}
