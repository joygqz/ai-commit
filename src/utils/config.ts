import { ConfigurationTarget, workspace } from 'vscode'
import { EXTENSION_ID } from './constants'

class ConfigManager {
  private readonly section = EXTENSION_ID

  /**
   * 获取配置项的值
   * @param key 配置键，如 'service.apiKey'（不包含扩展 ID 前缀）
   * @param defaultValue 默认值，当配置项不存在时返回
   * @returns 配置项的值
   * @example
   * ```typescript
   * const apiKey = config.get<string>('service.apiKey', '')
   * ```
   */
  get<T>(key: string, defaultValue?: T): T {
    return workspace.getConfiguration(this.section).get<T>(key, defaultValue as T)
  }

  /**
   * 更新配置项
   * @param key 配置键
   * @param value 新值
   * @param target 配置目标：全局、工作区或工作区文件夹，默认为全局
   * @example
   * ```typescript
   * await config.update('service.model', 'gpt-4', ConfigurationTarget.Global)
   * ```
   */
  async update<T>(
    key: string,
    value: T,
    target: ConfigurationTarget = ConfigurationTarget.Global,
  ): Promise<void> {
    await workspace.getConfiguration(this.section).update(key, value, target)
  }

  /**
   * 获取服务相关配置
   * @returns 服务配置对象
   */
  getServiceConfig() {
    return {
      apiKey: this.get<string>('service.apiKey', ''),
      baseURL: this.get<string>('service.baseURL', 'https://api.deepseek.com'),
      model: this.get<string>('service.model', 'deepseek-chat'),
    }
  }

  /**
   * 获取格式相关配置
   * @returns 格式配置对象
   */
  getFormatConfig() {
    return {
      commitMessageLanguage: this.get<string>('format.commitMessageLanguage', 'Simplified Chinese'),
      enableEmojiPrefix: this.get<boolean>('format.enableEmojiPrefix', false),
      customPrompt: this.get<string>('format.customPrompt', ''),
    }
  }
}

export const config = new ConfigManager()
