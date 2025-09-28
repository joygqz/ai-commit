import type { ChatCompletionMessageParam } from 'openai/resources'
import * as fs from 'node:fs'
import { defineExtension } from 'reactive-vscode'
import { commands, extensions, window } from 'vscode'
import { getDiffStaged } from './git-utils'
import { ChatGPTAPI } from './openai-utils'
import { getMainCommitPrompt } from './prompts'
import { addPeriodIfMissing, ProgressHandler } from './utils'

export async function getRepo(arg: any) {
  const gitApi = extensions.getExtension('vscode.git')?.exports.getAPI(1)
  if (!gitApi) {
    window.showErrorMessage('Git extension not found.')
    throw new Error('Git extension not found.')
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
    const repo = await getRepo(context)

    const { diff, error } = await getDiffStaged(repo)

    if (error) {
      window.showErrorMessage(`Failed to get staged changes: ${error}.`)
      return
    }

    if (!diff || diff === 'No changes staged.') {
      window.showInformationMessage('No changes staged for commit.')
      return
    }

    const scmInputBox = repo.inputBox
    if (!scmInputBox) {
      window.showErrorMessage('Unable to find the SCM input box.')
      return
    }

    const additionalContext = scmInputBox.value.trim()

    const messages = await generateCommitMessageChatCompletionPrompt(
      diff,
      additionalContext,
    )

    return ProgressHandler.withProgress('', async (progress) => {
      progress.report({
        message: additionalContext
          ? 'Generating commit message with additional context...'
          : 'Generating commit message...',
      })

      try {
        const commitMessage = await ChatGPTAPI(messages as ChatCompletionMessageParam[])

        if (commitMessage) {
          scmInputBox.value = commitMessage
        }
        else {
          throw new Error('Failed to generate commit message.')
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
