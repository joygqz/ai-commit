import type { ChatCompletionMessageParam } from 'openai/resources'
import { defineExtension } from 'reactive-vscode'
import { commands, window } from 'vscode'
import { config, validateConfig } from './config'
import { getDiffStaged, getRepo } from './git-utils'
import { getMessages } from './i18n'
import { ChatGPTStreamAPI, showModels } from './openai-utils'
import { generateCommitMessageChatCompletionPrompt } from './prompts'
import { ProgressHandler } from './utils'

const { activate, deactivate } = defineExtension((context) => {
  let activeAbortController: AbortController | null = null
  context.subscriptions.push(commands.registerCommand('commit-genie.generateCommitMessage', async () => {
    try {
      if (activeAbortController) {
        activeAbortController.abort()
        activeAbortController = null
      }

      validateConfig()

      const messages = getMessages(config.commitMessageLanguage)
      const repo = await getRepo(context)

      const diff = await getDiffStaged(repo)

      if (!diff || diff === messages.noChangesStaged) {
        window.showInformationMessage(messages.noStagedChanges)
        return
      }

      const scmInputBox = repo?.inputBox
      if (!scmInputBox) {
        throw new Error(messages.scmInputBoxNotFound)
      }

      const messagePrompts = await generateCommitMessageChatCompletionPrompt(
        diff,
      )

      const abortController = new AbortController()
      activeAbortController = abortController

      try {
        return await ProgressHandler.withProgress('', async (progress) => {
          progress.report({ message: messages.generatingCommitMessage })

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
  }))

  context.subscriptions.push(commands.registerCommand('commit-genie.selectAvailableModel', async () => {
    try {
      validateConfig([
        { key: 'apiKey', errorMessage: messages => messages.apiKeyMissing },
        { key: 'baseURL', errorMessage: messages => messages.baseUrlMissing },
      ])
      const messages = getMessages(config.commitMessageLanguage)
      const models = await showModels()

      if (!models.length) {
        window.showWarningMessage(messages.noModelsAvailable)
        return
      }

      const currentModel = config.model

      const items = models.map(model => ({
        label: model,
        description: model === currentModel ? messages.currentModelIndicator : undefined,
      }))

      const picked = await window.showQuickPick(items, {
        title: messages.selectModelTitle,
        placeHolder: messages.selectModelPlaceholder,
        matchOnDescription: true,
      })

      if (!picked) {
        return
      }

      if (picked.label === currentModel) {
        window.showInformationMessage(messages.modelAlreadySelected)
        return
      }

      await config.$update('model', picked.label)

      window.showInformationMessage(messages.modelUpdated.replace('{model}', picked.label))
    }
    catch (error: any) {
      window.showErrorMessage(error.message)
    }
  }))
})

export { activate, deactivate }
