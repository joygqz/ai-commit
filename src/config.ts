import { defineConfigObject } from 'reactive-vscode'
import * as Meta from './generated/meta'
import { getMessages } from './i18n'

export const config = defineConfigObject<Meta.ScopedConfigKeyTypeMap>(
  Meta.scopedConfigs.scope,
  Meta.scopedConfigs.defaults,
)

interface ValidationField {
  key: keyof Meta.ScopedConfigKeyTypeMap
  errorMessage: (messages: ReturnType<typeof getMessages>) => string
}

const defaultValidationFields: ValidationField[] = [
  { key: 'apiKey', errorMessage: messages => messages.apiKeyMissing },
  { key: 'baseURL', errorMessage: messages => messages.baseUrlMissing },
  { key: 'model', errorMessage: messages => messages.modelMissing },
]

export function validateConfig(fields: ValidationField[] = defaultValidationFields) {
  const messages = getMessages(config.commitMessageLanguage)

  for (const field of fields) {
    if (!config[field.key]) {
      throw new Error(field.errorMessage(messages))
    }
  }
}
