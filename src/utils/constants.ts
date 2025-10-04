/**
 * 扩展标识符
 */
export const EXTENSION_ID = 'commit-genie'

/**
 * 命令 ID 常量集合
 */
export const COMMANDS = {
  /** 审查代码并生成 commit 消息命令 */
  REVIEW_AND_COMMIT: `${EXTENSION_ID}.reviewAndCommit`,
  /** 选择可用模型命令 */
  SELECT_AVAILABLE_MODEL: `${EXTENSION_ID}.selectAvailableModel`,
} as const

/**
 * API 配置常量
 */
export const API_CONFIG = {
  /** 默认请求超时时间（毫秒） */
  DEFAULT_TIMEOUT: 60000,
  /** 流式输出的温度参数（0 为确定性输出） */
  DEFAULT_TEMPERATURE: 0,
} as const

/**
 * Commit 消息格式常量
 */
export const COMMIT_FORMAT = {
  /** subject 最大长度 */
  MAX_SUBJECT_LENGTH: 50,
  /** body 每行最大长度 */
  MAX_BODY_LINE_LENGTH: 72,
} as const
