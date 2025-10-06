import type { ChatCompletionMessageParam } from 'openai/resources'
import { config } from './utils/config'
import { COMMIT_FORMAT } from './utils/constants'

/**
 * 代码 review 结果接口
 */
export interface CodeReviewResult {
  /** 是否通过 review */
  passed: boolean
  /** 问题列表 */
  issues: string[]
  /** 建议列表 */
  suggestions: string[]
  /** 严重性等级 */
  severity: 'error' | 'warning' | 'info'
}

/**
 * 审查和提交结果接口
 */
export interface ReviewAndCommitResult {
  review: CodeReviewResult
  commitMessage: string
}

/**
 * 审查模式类型
 */
export type ReviewMode = 'off' | 'lenient' | 'standard' | 'strict'

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
 * 获取不同模式的审查严格程度描述
 * @param mode 审查模式
 * @returns 严格程度描述
 */
function getReviewModeGuidelines(mode: ReviewMode): string {
  switch (mode) {
    case 'lenient':
      return `## LENIENT — CRITICAL Only

Report when visible in diff:
- Syntax/runtime errors, undefined vars/props, wrong operators
- Security risks: hardcoded secrets, SQL concat, HTML injection
- Fatal bugs: infinite loops, missing await, unhandled rejection

Rule: No evidence or uncertain → pass. Only critical issues set passed=false (severity="error").`

    case 'standard':
      return `## STANDARD — CRITICAL + MAJOR

Critical (visible):
- Syntax/runtime errors, type mismatches, undefined usage
- Security leaks: exposed credentials, injection vectors
- Data loss risks: unsafe deletes, broken migrations

Major (visible):
- Logic mistakes: wrong formulas, incorrect branching
- Error handling regressions: lost errors, ignored rejections
- Resource leaks: unclosed files, dangling connections
- Breaking changes: removed APIs, incompatible signatures

Rule: Doubt → pass. Raise only when certain. Severity="error" for critical, "warning" for major.
Result: passed=false when any are reported.`

    case 'strict':
      return `## STRICT — Everything Verifiable

Critical/Major: Same as standard mode.

Minor (visible):
- Code smells: magic numbers, duplicate code, dead blocks
- Type issues: \`any\`, missing null/undefined guards
- Bad practice: hardcoded paths, stray console.log, empty catch
- Excessive complexity: >100 line functions, >4 nest levels

Rule: Report only what diff proves. Any finding sets passed=false; severity matches level.`

    default:
      return ''
  }
}

/**
 * 创建代码 review 系统提示词
 * @param language review 结果的目标语言
 * @param mode 审查模式
 * @param customPrompt 自定义提示词（可选）
 * @param options 可选配置项
 * @param options.includeOutputShape 是否包含输出 JSON 模式描述，默认为 true
 * @returns 代码 review 系统提示词
 */
function createCodeReviewSystemContent(
  language: string,
  mode: ReviewMode = 'standard',
  customPrompt?: string,
  options?: { includeOutputShape?: boolean },
): string {
  const includeOutputShape = options?.includeOutputShape ?? true
  const modeGuidelines = getReviewModeGuidelines(mode)

  let content = `Code reviewer for git diff changes.

## Context Limit
- Input is ONLY git diff (lines with +/-). Full files are unseen.
- Do NOT assume hidden code; judge only what you see.

${modeGuidelines}

## Review Principles
- Evidence only: flag issues visible in diff lines.
- No assumptions: missing context/imports ≠ error.
- Uncertain? Pass. Absence of proof → no report.
- Scope: critique the change, not untouched code.

Language: ${language}. For Chinese, add spaces between Chinese/English/numbers.

Empty diff → pass with empty arrays.`

  if (includeOutputShape) {
    content += `

## Output JSON
{
  "passed": boolean,
  "severity": "error" | "warning" | "info",
  "issues": string[],
  "suggestions": string[]
}`
  }

  // 如果有自定义提示词，添加到末尾
  if (customPrompt && customPrompt.trim()) {
    content += `\n\n## Custom Review Rules (Additional Focus)\n\n${customPrompt.trim()}`
  }

  return content
}

/**
 * 创建提交消息系统提示词
 * @param language 输出语言
 * @param enableEmoji 是否启用 emoji
 * @param customPrompt 自定义提示词（可选）
 * @param options 可选配置，用于控制输出模式
 * @param options.outputMode 输出模式，默认为 message-only，可设置为 guideline-only
 * @returns 系统提示词内容
 */
function createCommitMessageSystemContent(
  language: string,
  enableEmoji: boolean,
  customPrompt?: string,
  options?: { outputMode?: 'message-only' | 'guideline-only' },
): string {
  const outputMode = options?.outputMode ?? 'message-only'

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

  const intro = outputMode === 'message-only'
    ? 'Commit message generator. Return ONLY the final commit message.'
    : 'Commit message generator guidelines for crafting the final commit message.'

  // 主要提示词内容
  let content = `${intro}

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
 * 生成统一的代码审查 + commit 消息提示词
 * @param diff Git diff 内容
 * @param mode 审查模式
 * @returns 聊天消息数组
 */
export async function generateReviewAndCommitPrompt(
  diff: string,
  mode: ReviewMode,
): Promise<ChatCompletionMessageParam[]> {
  const formatConfig = config.getFormatConfig()
  const commitConfig = config.getCommitConfig()
  const reviewConfig = config.getReviewConfig()

  const reviewGuidelines = createCodeReviewSystemContent(
    formatConfig.outputLanguage,
    mode,
    reviewConfig.customPrompt,
    { includeOutputShape: false },
  )

  const commitGuidelines = createCommitMessageSystemContent(
    formatConfig.outputLanguage,
    commitConfig.enableEmojiPrefix,
    commitConfig.customPrompt,
    { outputMode: 'guideline-only' },
  )

  const systemContent = `You are an expert assistant that must review a git diff and craft a Conventional Commit message in a single response.

### Task 1 — Code Review
${reviewGuidelines}

### Task 2 — Commit Message
${commitGuidelines}

### Output JSON
{
  "review": {
    "passed": boolean,
    "severity": "error" | "warning" | "info",
    "issues": string[],
    "suggestions": string[]
  },
  "commitMessage": string
}

Rules:
- The review field must follow Task 1 guidance and only use information visible in the diff.
- The commitMessage must follow Task 2 guidance, include emoji when requested, and stay within length limits.
- Always return raw JSON without Markdown code fences or commentary.
- Trim trailing whitespace in the commit message.`

  const trimmedDiff = diff.trim() || '[empty diff provided]'

  return [
    {
      role: 'system',
      content: systemContent,
    } satisfies ChatCompletionMessageParam,
    {
      role: 'user',
      content: trimmedDiff,
    } satisfies ChatCompletionMessageParam,
  ]
}
