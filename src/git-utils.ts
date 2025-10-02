import * as fs from 'node:fs'
import simpleGit from 'simple-git'
import { extensions, workspace } from 'vscode'
import { config } from './config'
import { getMessages } from './i18n'

export async function getRepo(arg: any) {
  const gitApi = extensions.getExtension('vscode.git')?.exports.getAPI(1)
  const messages = getMessages(config.commitMessageLanguage)

  if (!gitApi) {
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

export async function getDiffStaged(repo: any): Promise<string> {
  const messages = getMessages(config.commitMessageLanguage)
  const rootPath = repo?.rootUri?.fsPath || workspace.workspaceFolders?.[0].uri.fsPath

  if (!rootPath) {
    throw new Error(messages.noWorkspaceFound)
  }

  const git = simpleGit(rootPath)
  const diff = await git.diff(['--staged'])

  return diff || messages.noChangesStaged
}
