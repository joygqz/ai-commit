import type { ChatCompletionMessageParam } from 'openai/resources'
import OpenAI from 'openai'
import { config } from './config'

function getOpenAIConfig() {
  const apiKey = config.DEEPSEEK_API_KEY
  const baseURL = config.DEEPSEEK_BASE_URL

  if (!apiKey) {
    throw new Error('The DEEPSEEK_API_KEY environment variable is missing or empty.')
  }

  if (!baseURL) {
    throw new Error('The DEEPSEEK_BASE_URL environment variable is missing or empty.')
  }

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

export async function ChatGPTAPI(messages: ChatCompletionMessageParam[]) {
  const openai = createOpenAIApi()
  const model = config.DEEPSEEK_MODEL
  const temperature = 0

  if (!model) {
    throw new Error('The DEEPSEEK_MODEL environment variable is missing or empty.')
  }

  const completion = await openai.chat.completions.create({
    model,
    messages: messages as ChatCompletionMessageParam[],
    temperature,
  })

  return completion.choices[0]!.message?.content
}
