import type { ChatCompletionMessageParam } from 'openai/resources'
import type { ExtensionContext } from 'vscode'
import { ConfigurationTarget, l10n, window, workspace } from 'vscode'
import { ProgressHandler, validateConfig } from './utils'
import { name } from './utils/constants'
import { getDiffStaged, getRepo } from './utils/git'
import { ChatGPTStreamAPI, showModels } from './utils/openai'
import { generateCommitMessageChatCompletionPrompt } from './utils/prompts'

let activeAbortController: AbortController | null = null

async function generateCommitMessage(context: ExtensionContext) {
  try {
    const validation = validateConfig([
      {
        key: 'service.apiKey',
        required: true,
        errorMessage: l10n.t('API Key is required. Please configure it in settings.'),
      },
      {
        key: 'service.baseURL',
        required: true,
        errorMessage: l10n.t('Base URL is required. Please configure it in settings.'),
      },
      {
        key: 'service.model',
        required: true,
        errorMessage: l10n.t('Model is required. Please configure it in settings.'),
      },
    ])
    if (!validation.isValid) {
      window.showErrorMessage(validation.error!)
      return
    }

    if (activeAbortController) {
      activeAbortController.abort()
      activeAbortController = null
    }

    const repo = await getRepo(context)

    const diff = await getDiffStaged(repo)

    if (!diff || diff === l10n.t('No staged changes.')) {
      window.showInformationMessage(l10n.t('No staged changes to commit.'))
      return
    }

    const scmInputBox = repo?.inputBox
    if (!scmInputBox) {
      throw new Error(l10n.t('Unable to find SCM input box.'))
    }

    const messagePrompts = await generateCommitMessageChatCompletionPrompt(
      diff,
    )

    const abortController = new AbortController()
    activeAbortController = abortController

    try {
      return await ProgressHandler.withProgress('', async (progress) => {
        progress.report({ message: l10n.t('Generating commit message...') })

        scmInputBox.value = ''
        await ChatGPTStreamAPI(
          messagePrompts as ChatCompletionMessageParam[],
          (chunk: string) => {
            if (!abortController.signal.aborted) {
              scmInputBox.value += chunk
            }
          },
          { signal: abortController.signal },
        )
      })
    }
    finally {
      if (activeAbortController === abortController) {
        activeAbortController = null
      }
    }
  }
  catch (error: any) {
    if (error.message.toLowerCase().includes('aborted'))
      return

    window.showErrorMessage(error.message)
  }
}

async function selectAvailableModel() {
  try {
    const validation = validateConfig([
      {
        key: 'service.apiKey',
        required: true,
        errorMessage: l10n.t('API Key is required. Please configure it in settings.'),
      },
      {
        key: 'service.baseURL',
        required: true,
        errorMessage: l10n.t('Base URL is required. Please configure it in settings.'),
      },
    ])
    if (!validation.isValid) {
      window.showErrorMessage(validation.error!)
      return
    }

    const models = await showModels()

    if (!models.length) {
      window.showWarningMessage(l10n.t('No models available from current API configuration.'))
      return
    }

    const currentModel = workspace.getConfiguration(name).get('service.model') as string

    const items = models.map(model => ({
      label: model,
      description: model === currentModel ? l10n.t('Current') : undefined,
    }))

    const picked = await window.showQuickPick(items, {
      title: l10n.t('Select Model'),
      placeHolder: l10n.t('Please select a model to generate commit messages.'),
      matchOnDescription: true,
    })

    if (!picked) {
      return
    }

    await workspace.getConfiguration(name).update('service.model', picked.label, ConfigurationTarget.Global)
    window.showInformationMessage(l10n.t('Model updated to {0}.', picked.label))
  }
  catch (error: any) {
    window.showErrorMessage(error.message)
  }
}

export const commands = {
  generateCommitMessage,
  selectAvailableModel,
}
