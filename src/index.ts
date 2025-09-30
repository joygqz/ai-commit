import type { ChatCompletionMessageParam } from 'openai/resources'
import { defineExtension } from 'reactive-vscode'
import { commands, window } from 'vscode'
import { config, validateConfig } from './config'
import { getDiffStaged, getRepo } from './git-utils'
import { getMessages } from './i18n'
import { ChatGPTStreamAPI } from './openai-utils'
import { getMainCommitPrompt } from './prompts'
import { ProgressHandler } from './utils'

async function generateCommitMessageChatCompletionPrompt(diff: string, additionalContext?: string) {
  const INIT_MESSAGES_PROMPT = await getMainCommitPrompt()
  const chatContextAsCompletionRequest = [...INIT_MESSAGES_PROMPT]

  if (additionalContext) {
    chatContextAsCompletionRequest.push({
      role: 'user',
      content: `Additional context for the changes:\n${additionalContext}`,
    })
  }

  chatContextAsCompletionRequest.push({
    role: 'user',
    content: diff,
  })
  return chatContextAsCompletionRequest
}

const { activate, deactivate } = defineExtension((context) => {
  const disposable = commands.registerCommand('commit-genie.generateCommitMessage', async () => {
    try {
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

      const additionalContext = scmInputBox.value.trim()

      const messagePrompts = await generateCommitMessageChatCompletionPrompt(
        diff,
        additionalContext,
      )

      return ProgressHandler.withProgress('', async (progress, token) => {
        if (token.isCancellationRequested)
          return

        let isCancelled = false
        const cancelDisposable = token.onCancellationRequested(() => {
          isCancelled = true
        })

        progress.report({ message: additionalContext
          ? messages.generatingWithContext
          : messages.generatingCommitMessage })

        try {
          scmInputBox.value = ''
          await ChatGPTStreamAPI(messagePrompts as ChatCompletionMessageParam[], (chunk: string) => {
            if (isCancelled)
              return

            scmInputBox.value += chunk
          }, token)
        }
        catch (error: any) {
          if (isCancelled)
            return
          throw error
        }
        finally {
          cancelDisposable.dispose()
        }
      })
    }
    catch (error: any) {
      window.showErrorMessage(error.message)
    }
  })

  context.subscriptions.push(disposable)
})

export { activate, deactivate }
