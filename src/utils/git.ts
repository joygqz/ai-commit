import * as fs from 'node:fs'
import simpleGit from 'simple-git'
import { extensions, l10n, workspace } from 'vscode'

export async function getRepo(arg: any) {
  const gitApi = extensions.getExtension('vscode.git')?.exports.getAPI(1)
  if (!gitApi) {
    throw new Error('未找到 Git 扩展。')
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

export async function getDiffStaged(repo: any): Promise<string> {
  const rootPath = repo?.rootUri?.fsPath || workspace.workspaceFolders?.[0].uri.fsPath

  if (!rootPath) {
    throw new Error('未找到工作区文件夹。')
  }

  const git = simpleGit(rootPath)
  const diff = await git.diff(['--staged'])

  return diff || '没有暂存的更改。'
}
