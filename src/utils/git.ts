import type { ExtensionContext, Uri } from 'vscode'
import * as fs from 'node:fs'
import simpleGit from 'simple-git'
import { extensions, l10n, workspace } from 'vscode'

interface GitRepository {
  rootUri: Uri
  inputBox?: {
    value: string
  }
}

interface GitApi {
  repositories: GitRepository[]
}

interface GitExtensionExports {
  getAPI: (version: number) => GitApi
}

/**
 * 仓库上下文接口
 */
interface RepoContext {
  rootUri?: Uri
}

function isRepoContext(arg: ExtensionContext | RepoContext): arg is RepoContext {
  return Boolean((arg as RepoContext).rootUri)
}

function resolveRealPath(path: string): string {
  try {
    return fs.realpathSync(path)
  }
  catch {
    return path
  }
}

/**
 * 获取 Git 仓库实例
 * @param arg 扩展上下文或包含 rootUri 的对象
 * @returns Git 仓库实例
 * @throws 如果 Git 扩展未找到则抛出错误
 */
export async function getRepo(arg: ExtensionContext | RepoContext): Promise<GitRepository> {
  const gitExtension = extensions.getExtension<GitExtensionExports>('vscode.git')
  if (!gitExtension || typeof gitExtension.exports?.getAPI !== 'function') {
    throw new Error(l10n.t('Git extension not found.'))
  }

  const gitApi = gitExtension.exports.getAPI(1)

  if (!gitApi?.repositories?.length) {
    throw new Error(l10n.t('No Git repositories found in the current workspace.'))
  }

  // 如果传入的参数包含 rootUri，则尝试匹配对应的仓库
  if (isRepoContext(arg) && arg.rootUri) {
    const resourcePath = resolveRealPath(arg.rootUri.fsPath)
    const matchedRepo = gitApi.repositories.find((repo) => {
      const repoPath = resolveRealPath(repo.rootUri.fsPath)
      return resourcePath.startsWith(repoPath)
    })

    if (matchedRepo) {
      return matchedRepo
    }
  }
  // 默认返回第一个仓库
  return gitApi.repositories[0]
}

/**
 * 获取暂存区的 diff
 * @param repo Git 仓库实例
 * @returns 暂存区的 diff 内容，如果没有更改则返回提示信息
 * @throws 如果工作区文件夹未找到则抛出错误
 */
export async function getDiffStaged(repo: GitRepository): Promise<string> {
  // 获取仓库根路径
  const rootPath = repo?.rootUri?.fsPath || workspace.workspaceFolders?.[0].uri.fsPath

  if (!rootPath) {
    throw new Error(l10n.t('Workspace folder not found.'))
  }

  // 创建 simple-git 实例并获取暂存区的 diff
  const git = simpleGit(rootPath)
  const diff = await git.diff(['--staged'])

  return diff || l10n.t('No staged changes.')
}
