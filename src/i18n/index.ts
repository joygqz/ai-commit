import type { LanguageMessages } from './types'
import { en } from './en'

import { getLanguageCode } from './types'
import { zhCN } from './zh-CN'

const messages: Record<'zh-CN' | 'en', LanguageMessages> = {
  'en': en,
  'zh-CN': zhCN,
}

export function getMessages(configLanguage: string): LanguageMessages {
  const languageCode = getLanguageCode(configLanguage)
  return messages[languageCode]
}

export { en, zhCN }
