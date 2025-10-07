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
      return `## LENIENT Mode
Report ONLY when visible: syntax errors, undefined usage, security leaks (hardcoded secrets, SQL injection), fatal bugs (infinite loops, missing await).
Result: passed=false + severity="error" only for critical issues.`

    case 'standard':
      return `## STANDARD Mode
Critical (severity="error"): syntax/type errors, security leaks, data loss risks.
Major (severity="warning"): logic errors, error handling gaps, resource leaks.
Result: passed=false when any reported.`

    case 'strict':
      return `## STRICT Mode
Critical/Major: same as standard.
Minor (severity="info"): code smells, magic numbers, \`any\` type, hardcoded paths, console.log, >100 line functions, >4 nest levels.
Result: passed=false for any finding.`

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

  let content = `Review git diff changes (lines with +/- only).

${modeGuidelines}

Rules:
- Judge ONLY visible diff lines, not hidden code
- Missing imports/context ≠ error
- Uncertain → pass (absence of proof = no report)
- Keep issues/suggestions concise (1 line each)
- Language: ${language}${language.includes('Chinese') ? ', add spaces between Chinese/English/numbers' : ''}
- Empty diff → passed=true, empty arrays`

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
[BREAKING CHANGE: <desc>]

- Subject: imperative, ≤${COMMIT_FORMAT.MAX_SUBJECT_LENGTH} chars, no period
- Scope: optional, clarifies module/package
- Body: "- " bullets, ≤${COMMIT_FORMAT.MAX_BODY_LINE_LENGTH} chars/line, explain why/how; skip if obvious
- Breaking: add footer if backward incompatible

## Rules
- Pick most specific type (priority: feat > fix > refactor > perf > docs/test/style)
- Empty diff → chore
- Revert: revert: <original type>(<scope>): <original subject>
- Write in ${language}${language.includes('Chinese') ? ', add spaces between Chinese/English/numbers' : ''}
- Keep types (feat/fix/etc), scope, identifiers, paths in English`

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

  const systemContent = `Review git diff and generate Conventional Commit message.

### Task 1 — Code Review
${reviewGuidelines}

### Task 2 — Commit Message
${commitGuidelines}

### Output
Return json (double quotes, no markdown):

{
  "review": {
    "passed": true,
    "severity": "info",
    "issues": [],
    "suggestions": []
  },
  "commitMessage": "feat(auth): add OAuth2 support"
}

Severity rules:
- "error": critical issues (syntax, security, data loss) → passed=false
- "warning": major issues (logic, error handling, resources) → passed=false
- "info": minor issues (code smells, style) → passed=false in strict mode only
- passed=true → severity="info", empty arrays`

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
