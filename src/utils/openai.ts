import type { ChatCompletionMessageParam } from 'openai/resources'
import OpenAI from 'openai'
import { config } from './config'

/**
 * 获取 OpenAI 配置
 * @returns 服务配置对象
 */
function getOpenAIConfig() {
  return config.getServiceConfig()
}

/**
 * 创建 OpenAI API 客户端实例
 * @returns OpenAI 客户端实例
 */
export function createOpenAIApi() {
  const serviceConfig = getOpenAIConfig()
  return new OpenAI({
    apiKey: serviceConfig.apiKey,
    baseURL: serviceConfig.baseURL,
  })
}

/**
 * 调用 ChatGPT 流式 API
 * @param messages 聊天消息数组，包含系统提示和用户输入
 * @param onChunk 每次接收到内容块时的回调函数
 * @param options 可选配置对象
 * @param options.signal 可选的中止信号，用于取消请求
 * @returns 完整的响应内容
 * @throws 如果请求失败则抛出错误（中止除外）
 */
export async function ChatGPTStreamAPI(
  messages: ChatCompletionMessageParam[],
  onChunk: (chunk: string) => void,
  options: { signal?: AbortSignal } = {},
): Promise<string> {
  const { signal } = options
  const openai = createOpenAIApi()
  const { model } = config.getServiceConfig()
  const temperature = 0 // 使用确定性输出

  // 创建流式聊天完成请求
  const stream = await openai.chat.completions.create({
    model,
    messages: messages as ChatCompletionMessageParam[],
    temperature,
    stream: true,
  }, { signal })

  let fullContent = ''

  try {
    // 迭代处理流式响应
    for await (const chunk of stream) {
      if (signal?.aborted) {
        break
      }
      const content = chunk.choices[0]?.delta?.content || ''
      if (content) {
        fullContent += content
        onChunk(content)
        // 添加小延迟，使流式输出更流畅
        await new Promise(resolve => setTimeout(resolve, 10))
      }
    }
  }
  catch (error) {
    // 如果是中止操作，返回已接收的内容
    if (signal?.aborted) {
      return fullContent
    }
    throw error
  }

  return fullContent
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
