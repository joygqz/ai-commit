import * as fs from 'node:fs'
import simpleGit from 'simple-git'
import { extensions, l10n, workspace } from 'vscode'

/**
 * 获取 Git 仓库实例
 * @param arg 扩展上下文或包含 rootUri 的对象
 * @returns Git 仓库实例
 * @throws 如果 Git 扩展未找到则抛出错误
 */
export async function getRepo(arg: any) {
  // 获取 VS Code 内置的 Git 扩展 API
  const gitApi = extensions.getExtension('vscode.git')?.exports.getAPI(1)
  if (!gitApi) {
    throw new Error(l10n.t('Git extension not found.'))
  }

  // 如果传入的参数包含 rootUri，则尝试匹配对应的仓库
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
  // 默认返回第一个仓库
  return gitApi.repositories[0]
}

/**
 * 获取暂存区的 diff
 * @param repo Git 仓库实例
 * @returns 暂存区的 diff 内容，如果没有更改则返回提示信息
 * @throws 如果工作区文件夹未找到则抛出错误
 */
export async function getDiffStaged(repo: any): Promise<string> {
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
