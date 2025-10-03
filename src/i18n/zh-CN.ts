import type { LanguageMessages } from './types'

export const zhCN: LanguageMessages = {
  gitExtensionNotFound: '未找到 Git 扩展。',
  noStagedChanges: '没有暂存的更改可提交。',
  scmInputBoxNotFound: '无法找到 SCM 输入框。',
  generatingCommitMessage: '正在生成提交信息...',
  failedToGenerateCommitMessage: '生成提交信息失败。',

  noWorkspaceFound: '未找到工作区文件夹。',
  noChangesStaged: '没有暂存的更改。',

  apiKeyMissing: 'API Key 配置缺失或为空。',
  baseUrlMissing: 'Base URL 配置缺失或为空。',
  modelMissing: 'Model 配置缺失或为空。',
  selectModelTitle: '选择模型',
  selectModelPlaceholder: '请选择用于生成提交信息的模型。',
  noModelsAvailable: '当前 API 配置未返回可用模型。',
  modelUpdated: '模型已更新为 {model}。',
  modelAlreadySelected: '该模型已经在使用中。',
  currentModelIndicator: '当前使用',
}
