export interface LanguageMessages {
  // Index.ts messages
  gitExtensionNotFound: string
  noStagedChanges: string
  scmInputBoxNotFound: string
  failedToGetStagedChanges: string
  generatingCommitMessage: string
  generatingWithContext: string
  failedToGenerateCommitMessage: string

  // Git utils messages
  noWorkspaceFound: string
  noChangesStaged: string

  // OpenAI utils messages
  apiKeyMissing: string
  baseUrlMissing: string
  modelMissing: string
}

// 语言代码映射
export function getLanguageCode(configLanguage: string): 'zh-CN' | 'en' {
  return configLanguage === 'Simplified Chinese' ? 'zh-CN' : 'en'
}
