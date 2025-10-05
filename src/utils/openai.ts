import type { ChatCompletionMessageParam } from 'openai/resources'
import OpenAI from 'openai'
import { config } from './config'
import { API_CONFIG } from './constants'
import { logger } from './logger'
import { tokenTracker } from './token-tracker'

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
 * Token 使用统计接口
 */
export interface TokenUsage {
  promptTokens: number
  completionTokens: number
  totalTokens: number
  cachedTokens?: number
}

/**
 * 记录 token 使用信息
 * @param usage Token 使用统计
 */
function recordTokenUsage(usage: TokenUsage): void {
  const parts: string[] = []

  // 基础 token 信息
  parts.push(`Token Usage: ${usage.totalTokens} total`)
  parts.push(`(${usage.promptTokens} prompt + ${usage.completionTokens} completion)`)

  // 缓存信息
  if (usage.cachedTokens && usage.cachedTokens > 0) {
    const cacheHitRate = ((usage.cachedTokens / usage.promptTokens) * 100).toFixed(1)
    const cacheMissTokens = usage.promptTokens - usage.cachedTokens
    parts.push(`| Cache Hit: ${usage.cachedTokens} tokens (${cacheHitRate}%)`)
    parts.push(`Miss: ${cacheMissTokens} tokens`)
  }

  logger.info(parts.join(' '))

  // 更新状态栏显示
  tokenTracker.updateUsage(usage)
}

/**
 * 调用 ChatGPT 流式 API
 * @param messages 聊天消息数组，包含系统提示和用户输入
 * @param onChunk 每次接收到内容块时的回调函数
 * @param options 可选配置对象
 * @param options.signal 可选的中止信号，用于取消请求
 * @param options.timeout 请求超时时间（毫秒），默认 60 秒
 * @returns 包含完整响应内容和 token 使用统计的对象
 * @throws 如果请求失败则抛出错误（中止除外）
 */
export async function ChatGPTStreamAPI(
  messages: ChatCompletionMessageParam[],
  onChunk: (chunk: string) => void,
  options: { signal?: AbortSignal, timeout?: number } = {},
): Promise<{ content: string, usage?: TokenUsage }> {
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
      stream_options: { include_usage: true },
    }, { signal: combinedSignal })

    let fullContent = ''
    let usage: TokenUsage | undefined

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

        // 捕获最后一个 chunk 中的 usage 信息
        if (chunk.usage) {
          const rawUsage = chunk.usage as any
          usage = {
            promptTokens: rawUsage.prompt_tokens || 0,
            completionTokens: rawUsage.completion_tokens || 0,
            totalTokens: rawUsage.total_tokens || 0,
            cachedTokens: rawUsage.prompt_tokens_details?.cached_tokens || 0,
          }
        }
      }
    }
    catch (error) {
      // 如果是中止操作，返回已接收的内容
      if (combinedSignal?.aborted) {
        return { content: fullContent, usage }
      }
      throw error
    }

    // 记录 token 使用信息
    if (usage) {
      recordTokenUsage(usage)
    }

    return { content: fullContent, usage }
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
 * @returns 包含完整响应内容和 token 使用统计的对象
 * @throws 如果请求失败则抛出错误（中止除外）
 */
export async function ChatGPTAPI(
  messages: ChatCompletionMessageParam[],
  options: { signal?: AbortSignal, timeout?: number } = {},
): Promise<{ content: string, usage?: TokenUsage }> {
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

    // 提取 token 使用情况
    let usage: TokenUsage | undefined
    if (response.usage) {
      const rawUsage = response.usage as any

      // 支持 OpenAI 和 DeepSeek 两种格式
      const cachedTokens = rawUsage.prompt_tokens_details?.cached_tokens
        || rawUsage.prompt_cache_hit_tokens
        || 0

      usage = {
        promptTokens: rawUsage.prompt_tokens || 0,
        completionTokens: rawUsage.completion_tokens || 0,
        totalTokens: rawUsage.total_tokens || 0,
        cachedTokens,
      }
    }

    // 记录 token 使用信息
    if (usage) {
      recordTokenUsage(usage)
    }

    return {
      content: response.choices[0]?.message?.content || '',
      usage,
    }
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
export async function getAvailableModels() {
  const openai = createOpenAIApi()
  const models = await openai.models.list()
  const modelNames = models.data.map(model => model.id)
  return modelNames
}
