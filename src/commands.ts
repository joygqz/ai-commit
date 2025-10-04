import type { ChatCompletionMessageParam } from 'openai/resources'
import type { ExtensionContext } from 'vscode'
import { ConfigurationTarget, window, workspace } from 'vscode'
import { ProgressHandler } from './utils'
import { name } from './utils/constants'
import { getDiffStaged, getRepo } from './utils/git'
import { ChatGPTStreamAPI, showModels } from './utils/openai'
import { generateCommitMessageChatCompletionPrompt } from './utils/prompts'

let activeAbortController: AbortController | null = null

async function generateCommitMessage(context: ExtensionContext) {
  try {
    if (activeAbortController) {
      activeAbortController.abort()
      activeAbortController = null
    }

    const repo = await getRepo(context)

    const diff = await getDiffStaged(repo)

    if (!diff || diff === '没有暂存的更改。') {
      window.showInformationMessage('没有暂存的更改可提交。')
      return
    }

    const scmInputBox = repo?.inputBox
    if (!scmInputBox) {
      throw new Error('无法找到 SCM 输入框。')
    }

    const messagePrompts = await generateCommitMessageChatCompletionPrompt(
      diff,
    )

    const abortController = new AbortController()
    activeAbortController = abortController

    try {
      return await ProgressHandler.withProgress('', async (progress) => {
        progress.report({ message: '正在生成提交信息...' })

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
    const models = await showModels()

    if (!models.length) {
      window.showWarningMessage('当前 API 配置未返回可用模型。')
      return
    }

    const currentModel = workspace.getConfiguration(name).get('service.model') as string

    const items = models.map(model => ({
      label: model,
      description: model === currentModel ? '当前使用' : undefined,
    }))

    const picked = await window.showQuickPick(items, {
      title: '选择模型',
      placeHolder: '请选择用于生成提交信息的模型。',
      matchOnDescription: true,
    })

    if (!picked) {
      return
    }

    await workspace.getConfiguration(name).update('service.model', picked.label, ConfigurationTarget.Global)
    window.showInformationMessage('模型已更新为 {model}。'.replace('{model}', picked.label))
  }
  catch (error: any) {
    window.showErrorMessage(error.message)
  }
}

export const commands = {
  generateCommitMessage,
  selectAvailableModel,
}
