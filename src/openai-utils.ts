import type { ChatCompletionMessageParam } from 'openai/resources'
import OpenAI from 'openai'
import { config } from './config'

function getOpenAIConfig() {
  const apiKey = config['server.apiKey']
  const baseURL = config['server.baseURL']

  const _config: {
    apiKey?: string
    baseURL?: string
    defaultQuery?: { 'api-version': string }
    defaultHeaders?: { 'api-key': string }
  } = {}

  if (baseURL) {
    _config.baseURL = baseURL
  }

  if (apiKey) {
    _config.apiKey = apiKey
  }

  return _config
}

export function createOpenAIApi() {
  const config = getOpenAIConfig()
  return new OpenAI(config)
}

export async function ChatGPTStreamAPI(
  messages: ChatCompletionMessageParam[],
  onChunk: (chunk: string) => void,
  options: { signal?: AbortSignal } = {},
): Promise<string> {
  const { signal } = options
  const openai = createOpenAIApi()
  const model = config['server.model']
  const temperature = 0

  const stream = await openai.chat.completions.create({
    model,
    messages: messages as ChatCompletionMessageParam[],
    temperature,
    stream: true,
  }, { signal })

  let fullContent = ''

  try {
    for await (const chunk of stream) {
      if (signal?.aborted) {
        break
      }
      const content = chunk.choices[0]?.delta?.content || ''
      if (content) {
        fullContent += content
        onChunk(content)
        await new Promise(resolve => setTimeout(resolve, 10))
      }
    }
  }
  catch (error) {
    if (signal?.aborted) {
      return fullContent
    }
    throw error
  }

  return fullContent
}

export async function showModels() {
  const openai = createOpenAIApi()
  const models = await openai.models.list()
  const modelNames = models.data.map(model => model.id)
  return modelNames
}
