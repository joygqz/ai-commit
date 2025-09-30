import type { ChatCompletionMessageParam } from 'openai/resources'
import { defineExtension } from 'reactive-vscode'
import { commands, window } from 'vscode'
import { config, validateConfig } from './config'
import { getDiffStaged, getRepo } from './git-utils'
import { getMessages } from './i18n'
import { ChatGPTStreamAPI } from './openai-utils'
import { generateCommitMessageChatCompletionPrompt } from './prompts'
import { ProgressHandler } from './utils'

const { activate, deactivate } = defineExtension((context) => {
  let activeAbortController: AbortController | null = null
  const disposable = commands.registerCommand('commit-genie.generateCommitMessage', async () => {
    try {
      if (activeAbortController) {
        activeAbortController.abort()
        activeAbortController = null
      }

      validateConfig()

      const messages = getMessages(config.MESSAGE_LANGUAGE)
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
      if (error?.name === 'AbortError') {
        return
      }

      window.showErrorMessage(error?.message ?? String(error))
    }
  })

  context.subscriptions.push(disposable)
})

export { activate, deactivate }
