import type { LogOutputChannel } from 'vscode'
import { window } from 'vscode'
import { EXTENSION_NAME } from './constants'

const outputChannel: LogOutputChannel = window.createOutputChannel(EXTENSION_NAME, { log: true })

/**
 * 格式化附加数据为可读字符串
 */
function formatData(data: unknown): string {
  if (data === undefined || data === null) {
    return ''
  }

  // Error 对象特殊处理
  if (data instanceof Error) {
    const lines: string[] = []
    lines.push(`Error: ${data.name}: ${data.message}`)

    if ('cause' in data && data.cause) {
      lines.push(`Cause: ${String(data.cause)}`)
    }

    if (data.stack) {
      const stackLines = data.stack.split('\n')
      const relevantStack = stackLines.slice(1, 6)
      if (relevantStack.length > 0) {
        lines.push('Stack:')
        relevantStack.forEach(line => lines.push(`  ${line.trim()}`))
        if (stackLines.length > 6) {
          lines.push(`  ... (${stackLines.length - 6} more lines)`)
        }
      }
    }

    return `\n${lines.join('\n')}`
  }

  // 对象处理
  if (typeof data === 'object') {
    try {
      const json = JSON.stringify(data, null, 2)
      const lines = json.split('\n')

      if (lines.length <= 3) {
        return `\nData: ${json}`
      }

      const indented = lines.map(line => `  ${line}`).join('\n')
      return `\nData:\n${indented}`
    }
    catch (error) {
      if (error instanceof Error && error.message.includes('circular')) {
        return '\n[Circular Reference Detected]'
      }
      return '\n[Unable to stringify object]'
    }
  }

  // 原始类型
  const str = String(data)
  if (str.includes('\n')) {
    const lines = str.split('\n').map(line => `  ${line}`)
    return `\nMessage:\n${lines.join('\n')}`
  }

  return `\nData: ${str}`
}

/**
 * 日志工具函数
 */
export const logger = {
  debug(message: string, data?: unknown): void {
    outputChannel.debug(`${message}${formatData(data)}`)
  },

  info(message: string, data?: unknown): void {
    outputChannel.info(`${message}${formatData(data)}`)
  },

  warn(message: string, data?: unknown): void {
    outputChannel.warn(`${message}${formatData(data)}`)
  },

  error(message: string, error?: unknown): void {
    outputChannel.error(`${message}${formatData(error)}`)
  },

  show(): void {
    outputChannel.show()
  },

  clear(): void {
    outputChannel.clear()
  },

  dispose(): void {
    outputChannel.dispose()
  },
}
