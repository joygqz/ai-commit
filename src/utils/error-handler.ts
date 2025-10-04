import { l10n } from 'vscode'

/**
 * API 错误类型枚举
 */
export enum ApiErrorType {
  AUTHENTICATION = 'authentication',
  RATE_LIMIT = 'rate_limit',
  TIMEOUT = 'timeout',
  NETWORK = 'network',
  INVALID_REQUEST = 'invalid_request',
  SERVER_ERROR = 'server_error',
  ABORT = 'abort',
  UNKNOWN = 'unknown',
}

/**
 * 错误信息接口
 */
export interface ErrorInfo {
  type: ApiErrorType
  message: string
  originalError?: unknown
}

/**
 * 分析错误类型和消息
 * @param error 原始错误对象
 * @returns 错误信息对象
 */
export function analyzeError(error: unknown): ErrorInfo {
  if (!(error instanceof Error)) {
    return {
      type: ApiErrorType.UNKNOWN,
      message: l10n.t('An unknown error occurred: {0}', String(error)),
      originalError: error,
    }
  }

  const errorMessage = error.message.toLowerCase()

  // 检查中止错误
  if (errorMessage.includes('abort')) {
    return {
      type: ApiErrorType.ABORT,
      message: l10n.t('Request was cancelled.'),
      originalError: error,
    }
  }

  // 检查认证错误
  if (errorMessage.includes('401') || errorMessage.includes('unauthorized') || errorMessage.includes('invalid api key')) {
    return {
      type: ApiErrorType.AUTHENTICATION,
      message: l10n.t('Invalid API key. Please check your configuration in settings.'),
      originalError: error,
    }
  }

  // 检查速率限制
  if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
    return {
      type: ApiErrorType.RATE_LIMIT,
      message: l10n.t('Rate limit exceeded. Please try again later or check your API quota.'),
      originalError: error,
    }
  }

  // 检查超时错误
  if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
    return {
      type: ApiErrorType.TIMEOUT,
      message: l10n.t('Request timeout. Please check your network connection and try again.'),
      originalError: error,
    }
  }

  // 检查网络错误
  if (errorMessage.includes('network') || errorMessage.includes('econnrefused') || errorMessage.includes('fetch failed')) {
    return {
      type: ApiErrorType.NETWORK,
      message: l10n.t('Network error. Please check your internet connection and base URL configuration.'),
      originalError: error,
    }
  }

  // 检查无效请求
  if (errorMessage.includes('400') || errorMessage.includes('bad request') || errorMessage.includes('invalid')) {
    return {
      type: ApiErrorType.INVALID_REQUEST,
      message: l10n.t('Invalid request. Please check your configuration or try again.'),
      originalError: error,
    }
  }

  // 检查服务器错误
  if (errorMessage.includes('500') || errorMessage.includes('502') || errorMessage.includes('503') || errorMessage.includes('server error')) {
    return {
      type: ApiErrorType.SERVER_ERROR,
      message: l10n.t('Server error. The API service may be temporarily unavailable. Please try again later.'),
      originalError: error,
    }
  }

  // 默认返回原始错误消息
  return {
    type: ApiErrorType.UNKNOWN,
    message: error.message || l10n.t('An unexpected error occurred.'),
    originalError: error,
  }
}

/**
 * 获取用户友好的错误消息
 * @param error 原始错误对象
 * @returns 用户友好的错误消息字符串
 */
export function getUserFriendlyErrorMessage(error: unknown): string {
  const errorInfo = analyzeError(error)
  return errorInfo.message
}

/**
 * 检查错误是否应该被静默处理（不显示给用户）
 * @param error 原始错误对象
 * @returns 如果应该静默则返回 true
 */
export function shouldSilenceError(error: unknown): boolean {
  const errorInfo = analyzeError(error)
  return errorInfo.type === ApiErrorType.ABORT
}
