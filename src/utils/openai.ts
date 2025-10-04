import type { ChatCompletionMessageParam } from 'openai/resources'
import OpenAI from 'openai'
import { config } from './config'
import { API_CONFIG } from './constants'

/**
 * OpenAI 客户端缓存
 */
let cachedClient: OpenAI | null = null
let cachedConfigKey: string | null = null

/**
 * 获取 OpenAI 配置
 * @returns 服务配置对象
 */
function getOpenAIConfig() {
  return config.getServiceConfig()
}

/**
 * 生成配置键用于缓存比较
 * @param apiKey API 密钥
 * @param baseURL 基础 URL
 * @returns 配置键字符串
 */
function generateConfigKey(apiKey: string, baseURL: string): string {
  return `${apiKey}:${baseURL}`
}

/**
 * 创建 OpenAI API 客户端实例（带缓存）
 * @returns OpenAI 客户端实例
 */
export function createOpenAIApi(): OpenAI {
  const serviceConfig = getOpenAIConfig()
  const configKey = generateConfigKey(serviceConfig.apiKey, serviceConfig.baseURL)

  // 如果配置未改变，返回缓存的客户端
  if (cachedClient && cachedConfigKey === configKey) {
    return cachedClient
  }

  // 配置改变或首次创建，创建新客户端
  cachedClient = new OpenAI({
    apiKey: serviceConfig.apiKey,
    baseURL: serviceConfig.baseURL,
  })
  cachedConfigKey = configKey

  return cachedClient
}

/**
 * 清除 OpenAI 客户端缓存
 * 当配置更改时应调用此函数
 */
export function clearOpenAICache(): void {
  cachedClient = null
  cachedConfigKey = null
}

/**
 * 调用 ChatGPT 流式 API
 * @param messages 聊天消息数组，包含系统提示和用户输入
 * @param onChunk 每次接收到内容块时的回调函数
 * @param options 可选配置对象
 * @param options.signal 可选的中止信号，用于取消请求
 * @param options.timeout 请求超时时间（毫秒），默认 60 秒
 * @returns 完整的响应内容
 * @throws 如果请求失败则抛出错误（中止除外）
 */
export async function ChatGPTStreamAPI(
  messages: ChatCompletionMessageParam[],
  onChunk: (chunk: string) => void,
  options: { signal?: AbortSignal, timeout?: number } = {},
): Promise<string> {
  const { signal, timeout = API_CONFIG.DEFAULT_TIMEOUT } = options
  const openai = createOpenAIApi()
  const { model } = config.getServiceConfig()
  const temperature = API_CONFIG.DEFAULT_TEMPERATURE

  // 创建超时信号
  const timeoutController = new AbortController()
  const timeoutId = setTimeout(() => timeoutController.abort(), timeout)

  // 合并用户信号和超时信号
  const combinedSignal = signal
    ? AbortSignal.any([signal, timeoutController.signal])
    : timeoutController.signal

  try {
    // 创建流式聊天完成请求
    const stream = await openai.chat.completions.create({
      model,
      messages: messages as ChatCompletionMessageParam[],
      temperature,
      stream: true,
    }, { signal: combinedSignal })

    let fullContent = ''

    try {
      // 迭代处理流式响应
      for await (const chunk of stream) {
        if (combinedSignal?.aborted) {
          break
        }
        const content = chunk.choices[0]?.delta?.content || ''
        if (content) {
          fullContent += content
          onChunk(content)
        }
      }
    }
    catch (error) {
      // 如果是中止操作，返回已接收的内容
      if (combinedSignal?.aborted) {
        return fullContent
      }
      throw error
    }

    return fullContent
  }
  finally {
    // 清理超时定时器
    clearTimeout(timeoutId)
  }
}

/**
 * 调用 ChatGPT 非流式 API（用于获取结构化响应）
 * @param messages 聊天消息数组，包含系统提示和用户输入
 * @param options 可选配置对象
 * @param options.signal 可选的中止信号，用于取消请求
 * @param options.timeout 请求超时时间（毫秒），默认 60 秒
 * @returns 完整的响应内容
 * @throws 如果请求失败则抛出错误（中止除外）
 */
export async function ChatGPTAPI(
  messages: ChatCompletionMessageParam[],
  options: { signal?: AbortSignal, timeout?: number } = {},
): Promise<string> {
  const { signal, timeout = API_CONFIG.DEFAULT_TIMEOUT } = options
  const openai = createOpenAIApi()
  const { model } = config.getServiceConfig()
  const temperature = API_CONFIG.DEFAULT_TEMPERATURE

  // 创建超时信号
  const timeoutController = new AbortController()
  const timeoutId = setTimeout(() => timeoutController.abort(), timeout)

  // 合并用户信号和超时信号
  const combinedSignal = signal
    ? AbortSignal.any([signal, timeoutController.signal])
    : timeoutController.signal

  try {
    // 创建聊天完成请求
    const response = await openai.chat.completions.create({
      model,
      messages: messages as ChatCompletionMessageParam[],
      temperature,
      stream: false,
    }, { signal: combinedSignal })

    return response.choices[0]?.message?.content || ''
  }
  finally {
    // 清理超时定时器
    clearTimeout(timeoutId)
  }
}

/**
 * 获取可用的模型列表
 * @returns 模型 ID 数组
 */
export async function showModels() {
  const openai = createOpenAIApi()
  const models = await openai.models.list()
  const modelNames = models.data.map(model => model.id)
  return modelNames
}
