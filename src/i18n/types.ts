export interface LanguageMessages {
  gitExtensionNotFound: string
  noStagedChanges: string
  scmInputBoxNotFound: string
  generatingCommitMessage: string
  failedToGenerateCommitMessage: string

  noWorkspaceFound: string
  noChangesStaged: string

  apiKeyMissing: string
  baseUrlMissing: string
  modelMissing: string
  selectModelTitle: string
  selectModelPlaceholder: string
  noModelsAvailable: string
  modelUpdated: string
  modelAlreadySelected: string
  currentModelIndicator: string
}

export function getLanguageCode(configLanguage: string): 'zh-CN' | 'en' {
  return configLanguage === 'Simplified Chinese' ? 'zh-CN' : 'en'
}
