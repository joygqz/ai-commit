import type { ChatCompletionMessageParam } from 'openai/resources'
import { config } from '../utils/config'
import { COMMIT_FORMAT } from '../utils/constants'

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
 * 创建提交消息系统提示词
 * @param language 输出语言
 * @param enableEmoji 是否启用 emoji
 * @param customPrompt 自定义提示词（可选）
 * @returns 系统提示词内容
 */
function createCommitMessageSystemContent(language: string, enableEmoji: boolean, customPrompt?: string): string {
  // 构建提交类型列表
  const typeList = COMMIT_TYPES.map(({ type, description, emoji }) => {
    const prefix = enableEmoji ? `${emoji} ` : ''
    return `- ${prefix}**${type}**: ${description}`
  }).join('\n')

  // emoji 格式说明（如果启用）
  const emojiGuidelines = enableEmoji
    ? `
Use the emoji shown for the chosen type as the prefix.`
    : ''

  const emojiHint = enableEmoji ? '<emoji> ' : ''

  // 主要提示词内容
  let content = `Commit message generator. Return ONLY the final commit message.

## Types
${typeList}${emojiGuidelines}

## Format
${emojiHint}<type>[scope]: <subject>
[body]
[BREAKING CHANGE: <description>]

Subject: Imperative, ≤${COMMIT_FORMAT.MAX_SUBJECT_LENGTH} chars, no period.
Scope: Optional; include when it clarifies packages/modules.
Body: "- " bullets, ≤${COMMIT_FORMAT.MAX_BODY_LINE_LENGTH} chars each, explain why/how; skip if obvious.
Breaking: Add footer when backward incompatible.
Language: Follow the language rules section.

## Rules
1. Choose the most specific type. Mixed changes priority: feat > fix > refactor > perf > docs/test/style.
2. Keep one responsibility per commit.
3. Empty diff → chore.
4. Revert: revert: <original type>(<scope>): <original subject>.
5. Test-only changes: test(<scope>): summarize coverage.

## Language Rules
- Use ${language} for scope, subject, body bullets, and breaking change text.
- Keep commit types, code identifiers, and filenames verbatim; you may add ${language} clarification in parentheses.
- Avoid other languages except inside code/config quotes; for Chinese, insert spaces between Chinese, English, and numbers.`

  // 如果有自定义提示词，添加到末尾
  if (customPrompt && customPrompt.trim()) {
    content += `\n\n## Custom Rules (Override All Above)\n\n${customPrompt.trim()}`
  }

  return content
}

/**
 * 生成完整的 commit 消息聊天提示词
 * @param diff Git diff 内容
 * @returns 包含系统消息和用户消息的完整提示词数组
 */
export async function generateCommitMessageChatCompletionPrompt(diff: string): Promise<ChatCompletionMessageParam[]> {
  const formatConfig = config.getFormatConfig()
  const commitConfig = config.getCommitConfig()
  const trimmedDiff = diff.trim() || '[empty diff provided]'

  return [
    {
      role: 'system',
      content: createCommitMessageSystemContent(
        formatConfig.outputLanguage,
        commitConfig.enableEmojiPrefix,
        commitConfig.customPrompt,
      ),
    } satisfies ChatCompletionMessageParam,
    {
      role: 'user',
      content: trimmedDiff,
    } satisfies ChatCompletionMessageParam,
  ]
}
