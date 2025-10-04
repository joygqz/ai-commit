import type { LogOutputChannel } from 'vscode'
import { LogLevel, window } from 'vscode'
import { config } from './config'
import { EXTENSION_NAME } from './constants'

/**
 * 重新导出 VS Code 官方 LogLevel 枚举
 */
export { LogLevel }

/**
 * 将字符串转换为日志级别
 * @param level 日志级别字符串
 * @returns 日志级别枚举值
 */
function stringToLogLevel(level: string): LogLevel {
  switch (level.toLowerCase()) {
    case 'trace':
      return LogLevel.Trace
    case 'debug':
      return LogLevel.Debug
    case 'info':
      return LogLevel.Info
    case 'warn':
      return LogLevel.Warning
    case 'error':
      return LogLevel.Error
    default:
      return LogLevel.Warning
  }
}

/**
 * 日志管理器类
 * 使用 VS Code 官方 LogOutputChannel API
 * 提供分级日志记录功能，输出到 VS Code 输出面板
 */
class Logger {
  private outputChannel: LogOutputChannel = window.createOutputChannel(EXTENSION_NAME, { log: true })
  private _enabled = true // 生产环境默认启用，便于问题排查
  private _level: LogLevel = LogLevel.Warning // 默认只记录警告和错误

  /**
   * 启用日志输出
   */
  enable(): void {
    this._enabled = true
  }

  /**
   * 禁用日志输出
   */
  disable(): void {
    this._enabled = false
  }

  /**
   * 设置日志级别
   * @param level 日志级别（枚举值或字符串）
   */
  setLevel(level: LogLevel | string): void {
    if (typeof level === 'string') {
      this._level = stringToLogLevel(level)
    }
    else {
      this._level = level
    }
  }

  /**
   * 从 VS Code 配置初始化日志设置
   */
  initFromConfig(): void {
    const debugConfig = config.getDebugConfig()

    this._enabled = debugConfig.enableLogging
    this.setLevel(debugConfig.logLevel)
  }

  /**
   * 获取当前日志级别
   */
  get level(): LogLevel {
    return this._level
  }

  /**
   * 检查日志是否启用
   */
  get enabled(): boolean {
    return this._enabled
  }

  /**
   * 记录调试日志
   * @param message 日志消息
   * @param data 可选的附加数据
   */
  debug(message: string, data?: unknown): void {
    this.log(LogLevel.Debug, message, data)
  }

  /**
   * 记录信息日志
   * @param message 日志消息
   * @param data 可选的附加数据
   */
  info(message: string, data?: unknown): void {
    this.log(LogLevel.Info, message, data)
  }

  /**
   * 记录警告日志
   * @param message 日志消息
   * @param data 可选的附加数据
   */
  warn(message: string, data?: unknown): void {
    this.log(LogLevel.Warning, message, data)
  }

  /**
   * 记录错误日志
   * @param message 日志消息
   * @param error 错误对象或数据
   */
  error(message: string, error?: unknown): void {
    this.log(LogLevel.Error, message, error)
  }

  /**
   * 格式化数据为可读字符串
   * @param data 要格式化的数据
   * @returns 格式化后的字符串
   */
  private formatData(data: unknown): string {
    if (data === undefined || data === null) {
      return ''
    }

    // Error 对象特殊处理
    if (data instanceof Error) {
      const lines: string[] = []
      lines.push(`Error: ${data.name}: ${data.message}`)

      // Error Cause (ES2022)
      if ('cause' in data && data.cause) {
        lines.push(`Cause: ${String(data.cause)}`)
      }

      // 堆栈跟踪（优化格式）
      if (data.stack) {
        const stackLines = data.stack.split('\n')
        // 跳过第一行（重复的错误消息）
        const relevantStack = stackLines.slice(1, 6) // 只显示前5行
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

    // 对象处理（包括数组）
    if (typeof data === 'object') {
      try {
        const json = JSON.stringify(data, null, 2)
        const lines = json.split('\n')

        // 如果是单行或很短的对象，直接顶行显示
        if (lines.length <= 3) {
          return `\nData: ${json}`
        }

        // 多行对象，顶行显示标题，内容缩进
        const indented = lines.map(line => `  ${line}`).join('\n')
        return `\nData:\n${indented}`
      }
      catch (error) {
        // 处理循环引用
        if (error instanceof Error && error.message.includes('circular')) {
          return '\n[Circular Reference Detected]'
        }
        return '\n[Unable to stringify object]'
      }
    }

    // 字符串、数字、布尔值等原始类型
    const str = String(data)
    // 多行字符串处理
    if (str.includes('\n')) {
      const lines = str.split('\n').map(line => `  ${line}`)
      return `\nMessage:\n${lines.join('\n')}`
    }

    return `\nData: ${str}`
  }

  /**
   * 内部日志方法
   * @param level 日志级别
   * @param message 日志消息
   * @param data 可选的附加数据
   */
  private log(level: LogLevel, message: string, data?: unknown): void {
    if (!this._enabled || level < this._level) {
      return
    }

    const timestamp = new Date().toISOString()
    const levelName = LogLevel[level]
    const logMessage = `[${timestamp}] [${levelName}] ${message}${this.formatData(data)}`

    // 输出到输出面板
    switch (level) {
      case LogLevel.Trace:
        this.outputChannel.trace(logMessage)
        break
      case LogLevel.Debug:
        this.outputChannel.debug(logMessage)
        break
      case LogLevel.Info:
        this.outputChannel.info(logMessage)
        break
      case LogLevel.Warning:
        this.outputChannel.warn(logMessage)
        break
      case LogLevel.Error:
        this.outputChannel.error(logMessage)
        break
      case LogLevel.Off:
        // 不输出
        break
    }
  }

  /**
   * 显示输出面板
   */
  show(): void {
    this.outputChannel.show()
  }

  /**
   * 清空日志
   */
  clear(): void {
    this.outputChannel.clear()
  }

  /**
   * 释放资源
   */
  dispose(): void {
    this.outputChannel.dispose()
  }
}

/**
 * 全局日志实例
 */
export const logger = new Logger()
