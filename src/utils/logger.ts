import { window } from 'vscode'
import { EXTENSION_ID } from './constants'

/**
 * 日志级别枚举
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

/**
 * 日志管理器类
 * 提供分级日志记录功能，输出到 VS Code 输出面板
 */
class Logger {
  private outputChannel = window.createOutputChannel(EXTENSION_ID, { log: true })
  private _enabled = false
  private _level: LogLevel = LogLevel.INFO

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
   * @param level 日志级别
   */
  setLevel(level: LogLevel): void {
    this._level = level
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
    this.log(LogLevel.DEBUG, message, data)
  }

  /**
   * 记录信息日志
   * @param message 日志消息
   * @param data 可选的附加数据
   */
  info(message: string, data?: unknown): void {
    this.log(LogLevel.INFO, message, data)
  }

  /**
   * 记录警告日志
   * @param message 日志消息
   * @param data 可选的附加数据
   */
  warn(message: string, data?: unknown): void {
    this.log(LogLevel.WARN, message, data)
  }

  /**
   * 记录错误日志
   * @param message 日志消息
   * @param error 错误对象或数据
   */
  error(message: string, error?: unknown): void {
    this.log(LogLevel.ERROR, message, error)
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
    let logMessage = `[${timestamp}] [${levelName}] ${message}`

    if (data !== undefined) {
      if (data instanceof Error) {
        logMessage += `\n  Error: ${data.message}\n  Stack: ${data.stack}`
      }
      else if (typeof data === 'object') {
        try {
          logMessage += `\n  Data: ${JSON.stringify(data, null, 2)}`
        }
        catch {
          logMessage += `\n  Data: [Unable to stringify object]`
        }
      }
      else {
        logMessage += `\n  Data: ${String(data)}`
      }
    }

    // 输出到输出面板
    switch (level) {
      case LogLevel.DEBUG:
        this.outputChannel.debug(logMessage)
        break
      case LogLevel.INFO:
        this.outputChannel.info(logMessage)
        break
      case LogLevel.WARN:
        this.outputChannel.warn(logMessage)
        break
      case LogLevel.ERROR:
        this.outputChannel.error(logMessage)
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
