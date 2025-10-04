import type { ChatCompletionMessageParam } from 'openai/resources'
import { config } from './config'

/**
 * 提示词选项接口
 */
interface PromptOptions {
  /** commit 消息的语言 */
  language: string
  /** 是否启用 emoji 前缀 */
  enableEmoji: boolean
  /** 自定义提示词（可选） */
  customPrompt?: string
}

/**
 * Conventional Commits 规范的提交类型定义
 */
const COMMIT_TYPES = [
  { type: 'feat', description: 'new feature', emoji: '✨' },
  { type: 'fix', description: 'bug fix', emoji: '🐛' },
  { type: 'docs', description: 'documentation', emoji: '📚' },
  { type: 'style', description: 'formatting / code style', emoji: '💄' },
  { type: 'refactor', description: 'code refactoring', emoji: '♻️' },
  { type: 'perf', description: 'performance improvement', emoji: '⚡' },
  { type: 'test', description: 'testing', emoji: '✅' },
  { type: 'build', description: 'build system', emoji: '📦' },
  { type: 'ci', description: 'CI configuration', emoji: '👷' },
  { type: 'chore', description: 'maintenance', emoji: '🔧' },
  { type: 'revert', description: 'revert previous commit', emoji: '⏪' },
] as const

/**
 * 创建提交类型说明部分
 * @param enableEmoji 是否启用 emoji
 * @returns 格式化的提交类型说明文本
 */
function createCommitTypeSection(enableEmoji: boolean) {
  const bullets = COMMIT_TYPES.map(({ type, description, emoji }) => {
    const prefix = enableEmoji ? `${emoji} ` : ''
    return `- ${prefix}**${type}**: ${description}`
  })
  return bullets.join('\n')
}

/**
 * 创建 emoji 使用指南
 * @param enableEmoji 是否启用 emoji
 * @returns emoji 使用规则说明，如果未启用则返回空字符串
 */
function createEmojiGuidelines(enableEmoji: boolean) {
  if (!enableEmoji) {
    return ''
  }

  return `
### Emoji Rules
- Format: <emoji> <type>[scope]: <subject>
- Use matching emoji from the types above`
}

/**
 * 创建 commit 消息格式说明部分
 * @param enableEmoji 是否启用 emoji
 * @param language commit 消息的目标语言
 * @returns 格式说明文本
 */
function createWorkflowSection(enableEmoji: boolean, language: string) {
  const emojiHint = enableEmoji ? '<emoji> ' : ''

  return `## Format

${emojiHint}<type>[scope]: <subject>

[body]

### Subject (Required)
- Imperative mood, ≤50 chars, no period
- Add scope only when essential for clarity
- Single responsibility per commit

### Body (Optional)
- "- " bullet prefix, ≤72 chars/line
- Explain why/how when subject insufficient
- Omit if subject is self-explanatory

### Language
- All text in ${language}
- Space between Chinese/English/numbers`
}

/**
 * 创建工作流程检查清单
 * @returns 工作流程说明文本
 */
function createWorkflowChecklist() {
  return `## Process

1. Analyze diff → identify main change
2. Pick most precise type (never invent)
3. Write subject capturing core change
4. Add body only if adds value
5. Validate format compliance

**Empty/generated diffs**: Use chore type, describe effect or "no functional changes"`
}

/**
 * 创建特殊情况处理说明
 * @returns 特殊情况处理指南文本
 */
function createEdgeCaseSection() {
  return `## Special Cases

- **Mixed**: Pick dominant type, note others in body
- **Revert**: Use revert type with original subject
- **Config**: Focus on user impact, not tech details
- **Rename/Move**: State intent (e.g., "reorganize structure")
- **Test-only**: Use test type, summarize coverage`
}

/**
 * 创建完整的系统提示词内容
 * @param options 提示词选项
 * @returns 完整的系统提示词文本
 */
function createSystemContent(options: PromptOptions) {
  const { enableEmoji, language, customPrompt } = options

  const sections = [
    'You are a commit message generator. Analyze the git diff and output ONLY the final commit message—no explanations, markdown blocks, or extra text.',
    '',
    '## Types',
    '',
    createCommitTypeSection(enableEmoji),
    createEmojiGuidelines(enableEmoji),
    '',
    createWorkflowSection(enableEmoji, language),
    '',
    createWorkflowChecklist(),
    '',
    createEdgeCaseSection(),
  ]

  // 如果有自定义提示词，添加到末尾并标注为最高优先级
  if (customPrompt && customPrompt.trim()) {
    sections.push('', '## Custom Rules (Override All Above)', '', customPrompt.trim())
  }

  return sections.join('\n')
}

/**
 * 创建系统消息对象
 * @param options 提示词选项
 * @returns ChatGPT 系统消息对象
 */
function createSystemMessage(options: PromptOptions): ChatCompletionMessageParam {
  return {
    role: 'system',
    content: createSystemContent(options),
  }
}

/**
 * 获取主要的 commit 提示词
 * @returns 包含系统消息的数组
 */
async function getMainCommitPrompt(): Promise<ChatCompletionMessageParam[]> {
  const formatConfig = config.getFormatConfig()

  const options: PromptOptions = {
    language: formatConfig.commitMessageLanguage,
    enableEmoji: formatConfig.enableEmojiPrefix,
    customPrompt: formatConfig.customPrompt,
  }

  return [createSystemMessage(options)]
}

/**
 * 生成完整的 commit 消息聊天提示词
 * @param diff Git diff 内容
 * @returns 包含系统消息和用户消息的完整提示词数组
 */
export async function generateCommitMessageChatCompletionPrompt(diff: string): Promise<ChatCompletionMessageParam[]> {
  const baseMessages = await getMainCommitPrompt()
  const trimmedDiff = diff.trim() || '[empty diff provided]'

  return [
    ...baseMessages,
    {
      role: 'user',
      content: trimmedDiff,
    } satisfies ChatCompletionMessageParam,
  ]
}
