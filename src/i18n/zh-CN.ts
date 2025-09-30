import type { LanguageMessages } from './types'

export const zhCN: LanguageMessages = {
  // Index.ts messages
  gitExtensionNotFound: '未找到 Git 扩展。',
  noStagedChanges: '没有暂存的更改可提交。',
  scmInputBoxNotFound: '无法找到 SCM 输入框。',
  generatingCommitMessage: '正在生成提交信息...',
  generatingWithContext: '正在根据附加上下文生成提交信息...',
  failedToGenerateCommitMessage: '生成提交信息失败。',

  // Git utils messages
  noWorkspaceFound: '未找到工作区文件夹。',
  noChangesStaged: '没有暂存的更改。',

  // OpenAI utils messages
  apiKeyMissing: 'DEEPSEEK_API_KEY 环境变量缺失或为空。',
  baseUrlMissing: 'DEEPSEEK_BASE_URL 环境变量缺失或为空。',
  modelMissing: 'DEEPSEEK_MODEL 环境变量缺失或为空。',
}
