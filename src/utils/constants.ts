/**
 * 扩展标识符
 */
export const EXTENSION_ID = 'commit-genie'

/**
 * 命令 ID 常量集合
 */
export const COMMANDS = {
  /** 生成 commit 消息命令 */
  GENERATE_COMMIT_MESSAGE: `${EXTENSION_ID}.generateCommitMessage`,
  /** 选择可用模型命令 */
  SELECT_AVAILABLE_MODEL: `${EXTENSION_ID}.selectAvailableModel`,
} as const
