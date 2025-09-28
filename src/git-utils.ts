import simpleGit from 'simple-git'
import { workspace } from 'vscode'

export async function getDiffStaged(repo: any): Promise<{ diff: string, error?: string }> {
  try {
    const rootPath
      = repo?.rootUri?.fsPath || workspace.workspaceFolders?.[0].uri.fsPath

    if (!rootPath) {
      throw new Error('No workspace folder found.')
    }

    const git = simpleGit(rootPath)
    const diff = await git.diff(['--staged'])

    return {
      diff: diff || 'No changes staged.',
      error: undefined,
    }
  }
  catch (error: any) {
    return { diff: '', error: error.message }
  }
}
