import type { LanguageMessages } from './types'

export const en: LanguageMessages = {
  // Index.ts messages
  gitExtensionNotFound: 'Git extension not found.',
  noStagedChanges: 'No changes staged for commit.',
  scmInputBoxNotFound: 'Unable to find the SCM input box.',
  failedToGetStagedChanges: 'Failed to get staged changes',
  generatingCommitMessage: 'Generating commit message...',
  generatingWithContext: 'Generating commit message with additional context...',
  failedToGenerateCommitMessage: 'Failed to generate commit message.',

  // Git utils messages
  noWorkspaceFound: 'No workspace folder found.',
  noChangesStaged: 'No changes staged.',

  // OpenAI utils messages
  apiKeyMissing: 'The DEEPSEEK_API_KEY environment variable is missing or empty.',
  baseUrlMissing: 'The DEEPSEEK_BASE_URL environment variable is missing or empty.',
  modelMissing: 'The DEEPSEEK_MODEL environment variable is missing or empty.',
}
