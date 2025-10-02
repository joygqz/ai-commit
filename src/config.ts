import { defineConfigObject } from 'reactive-vscode'
import * as Meta from './generated/meta'
import { getMessages } from './i18n'

export const config = defineConfigObject<Meta.ScopedConfigKeyTypeMap>(
  Meta.scopedConfigs.scope,
  Meta.scopedConfigs.defaults,
)

export function validateConfig() {
  const messages = getMessages(config['format.commitMessageLanguage'])

  if (!config['server.apiKey']) {
    throw new Error(messages.apiKeyMissing)
  }

  if (!config['server.baseURL']) {
    throw new Error(messages.baseUrlMissing)
  }

  if (!config['server.model']) {
    throw new Error(messages.modelMissing)
  }
}
