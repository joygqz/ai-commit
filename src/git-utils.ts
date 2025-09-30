import simpleGit from 'simple-git'
import { workspace } from 'vscode'
import { config } from './config'
import { getMessages } from './i18n'

export async function getDiffStaged(repo: any): Promise<{ diff: string, error?: string }> {
  try {
    const messages = getMessages(config.MESSAGE_LANGUAGE)
    const rootPath = repo?.rootUri?.fsPath || workspace.workspaceFolders?.[0].uri.fsPath

    if (!rootPath) {
      throw messages.noWorkspaceFound
    }

    const git = simpleGit(rootPath)
    const diff = await git.diff(['--staged'])

    return {
      diff: diff || messages.noChangesStaged,
      error: undefined,
    }
  }
  catch (error: any) {
    return { diff: '', error: error.message }
  }
}
