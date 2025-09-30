import type { LanguageMessages } from './types'

export const en: LanguageMessages = {
  // Index.ts messages
  gitExtensionNotFound: 'Git extension not found.',
  noStagedChanges: 'No changes staged for commit.',
  scmInputBoxNotFound: 'Unable to find the SCM input box.',
  generatingCommitMessage: 'Generating commit message...',
  generatingWithContext: 'Generating commit message with additional context...',
  failedToGenerateCommitMessage: 'Failed to generate commit message.',

  // Git utils messages
  noWorkspaceFound: 'No workspace folder found.',
  noChangesStaged: 'No changes staged.',

  // OpenAI utils messages
  apiKeyMissing: 'The API_KEY configuration is missing or empty.',
  baseUrlMissing: 'The BASE_URL configuration is missing or empty.',
  modelMissing: 'The MODEL configuration is missing or empty.',
}
