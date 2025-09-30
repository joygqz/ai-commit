import { defineConfigObject } from 'reactive-vscode'
import * as Meta from './generated/meta'
import { getMessages } from './i18n'

export const config = defineConfigObject<Meta.ScopedConfigKeyTypeMap>(
  Meta.scopedConfigs.scope,
  Meta.scopedConfigs.defaults,
)

export function validateConfig() {
  const messages = getMessages(config.MESSAGE_LANGUAGE)

  if (!config.API_KEY) {
    throw new Error(messages.apiKeyMissing)
  }

  if (!config.BASE_URL) {
    throw new Error(messages.baseUrlMissing)
  }

  if (!config.MODEL) {
    throw new Error(messages.modelMissing)
  }
}
