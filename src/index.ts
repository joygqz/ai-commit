import type { ChatCompletionMessageParam } from 'openai/resources'
import * as fs from 'node:fs'
import { defineExtension } from 'reactive-vscode'
import { commands, extensions, window } from 'vscode'
import { config } from './config'
import { getDiffStaged } from './git-utils'
import { getMessages } from './i18n'
import { ChatGPTAPI } from './openai-utils'
import { getMainCommitPrompt } from './prompts'
import { addPeriodIfMissing, ProgressHandler } from './utils'

export async function getRepo(arg: any) {
  const gitApi = extensions.getExtension('vscode.git')?.exports.getAPI(1)
  const messages = getMessages(config.MESSAGE_LANGUAGE)

  if (!gitApi) {
    window.showErrorMessage(messages.gitExtensionNotFound)
    throw new Error(messages.gitExtensionNotFound)
  }

  if (typeof arg === 'object' && arg.rootUri) {
    const resourceUri = arg.rootUri
    const realResourcePath: string = fs.realpathSync(resourceUri!.fsPath)
    for (let i = 0; i < gitApi.repositories.length; i++) {
      const repo = gitApi.repositories[i]
      if (realResourcePath.startsWith(repo.rootUri.fsPath)) {
        return repo
      }
    }
  }
  return gitApi.repositories[0]
}

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
    const messages = getMessages(config.MESSAGE_LANGUAGE)
    const repo = await getRepo(context)

    const { diff, error } = await getDiffStaged(repo)

    if (error) {
      window.showErrorMessage(`${messages.failedToGetStagedChanges}: ${error}.`)
      return
    }

    if (!diff || diff === messages.noChangesStaged) {
      window.showInformationMessage(messages.noStagedChanges)
      return
    }

    const scmInputBox = repo.inputBox
    if (!scmInputBox) {
      window.showErrorMessage(messages.scmInputBoxNotFound)
      return
    }

    const additionalContext = scmInputBox.value.trim()

    const messagePrompts = await generateCommitMessageChatCompletionPrompt(
      diff,
      additionalContext,
    )

    return ProgressHandler.withProgress('', async (progress) => {
      progress.report({
        message: additionalContext
          ? messages.generatingWithContext
          : messages.generatingCommitMessage,
      })

      try {
        const commitMessage = await ChatGPTAPI(messagePrompts as ChatCompletionMessageParam[])

        if (commitMessage) {
          scmInputBox.value = commitMessage
        }
        else {
          throw new Error(messages.failedToGenerateCommitMessage)
        }
      }
      catch (error: any) {
        window.showErrorMessage(addPeriodIfMissing(error.toString()))
      }
    })
  })

  context.subscriptions.push(disposable)
})

export { activate, deactivate }
