import type { LanguageMessages } from './types'

export const en: LanguageMessages = {
  gitExtensionNotFound: 'Git extension not found.',
  noStagedChanges: 'No changes staged for commit.',
  scmInputBoxNotFound: 'Unable to find the SCM input box.',
  generatingCommitMessage: 'Generating commit message...',
  failedToGenerateCommitMessage: 'Failed to generate commit message.',

  noWorkspaceFound: 'No workspace folder found.',
  noChangesStaged: 'No changes staged.',

  apiKeyMissing: 'The API_KEY configuration is missing or empty.',
  baseUrlMissing: 'The BASE_URL configuration is missing or empty.',
  modelMissing: 'The MODEL configuration is missing or empty.',
  selectModelTitle: 'Select a model',
  selectModelPlaceholder: 'Pick a model to use for commit message generation.',
  noModelsAvailable: 'No models are available for the current API configuration.',
  modelSelectionCancelled: 'Model selection cancelled.',
  modelUpdated: 'Model updated to {model}.',
  modelAlreadySelected: 'The selected model is already active.',
  currentModelIndicator: 'Current model',
}
