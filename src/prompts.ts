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
export type ReviewMode = 'lenient' | 'standard' | 'strict'

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

interface MarkdownSection {
  title?: string
  level?: number
  content: string
}

function renderSections(sections: Array<MarkdownSection | undefined>): string {
  return sections
    .filter((section): section is MarkdownSection => Boolean(section && section.content.trim()))
    .map(({ title, level = 0, content }) => {
      const body = content.trim()
      if (!title)
        return body

      const hashes = '#'.repeat(Math.max(1, level))
      return `${hashes} ${title}\n\n${body}`
    })
    .join('\n\n')
}

function bulletList(items: string[]): string {
  return items.map(item => `- ${item}`).join('\n')
}

function optionalSection(options: MarkdownSection, predicate: boolean): MarkdownSection | undefined {
  return predicate ? options : undefined
}

const REVIEW_MODE_GUIDELINES: Record<ReviewMode, MarkdownSection> = {
  lenient: {
    title: 'LENIENT Mode',
    level: 3,
    content: 'Report ONLY when visible: syntax errors, undefined usage, security leaks (hardcoded secrets, SQL injection), fatal bugs (infinite loops, missing await).\nResult: passed=false + severity="error" only for critical issues.',
  },
  standard: {
    title: 'STANDARD Mode',
    level: 3,
    content: 'Critical (severity="error"): syntax/type errors, security leaks, data loss risks.\nMajor (severity="warning"): logic errors, error handling gaps, resource leaks.\nResult: passed=false when any reported.',
  },
  strict: {
    title: 'STRICT Mode',
    level: 3,
    content: 'Critical/Major: same as standard.\nMinor (severity="info"): code smells, magic numbers, `any` type, hardcoded paths, console.log, >100 line functions, >4 nest levels.\nResult: passed=false for any finding.',
  },
}

function renderCommitTypes(enableEmoji: boolean): string {
  return COMMIT_TYPES
    .map(({ type, description, emoji }) => {
      const prefix = enableEmoji && emoji ? `${emoji} ` : ''
      return `- ${prefix}**${type}**: ${description}`
    })
    .join('\n')
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
  const languageNote = language.includes('Chinese') ? ', add spaces between Chinese/English/numbers' : ''
  const customContent = customPrompt?.trim()

  const overviewSection: MarkdownSection = {
    title: 'Overview',
    level: 3,
    content: 'Review git diff changes (lines with +/- only).',
  }

  const rulesSection: MarkdownSection = {
    title: 'Rules',
    level: 3,
    content: bulletList([
      'Judge ONLY visible diff lines, not hidden code',
      'Missing imports/context ≠ error',
      'Uncertain → pass (absence of proof = no report)',
      'Keep issues/suggestions concise (1 line each)',
      `Language: ${language}${languageNote}`,
      'Empty diff → passed=true, empty arrays',
    ]),
  }

  const outputShapeSection: MarkdownSection = {
    title: 'Output JSON',
    level: 3,
    content: `{
  "passed": boolean,
  "severity": "error" | "warning" | "info",
  "issues": string[],
  "suggestions": string[]
}`,
  }

  return renderSections([
    overviewSection,
    REVIEW_MODE_GUIDELINES[mode],
    rulesSection,
    optionalSection(outputShapeSection, includeOutputShape),
    optionalSection({
      title: 'Custom Review Rules (Additional Focus)',
      level: 3,
      content: customContent ?? '',
    }, Boolean(customContent)),
  ])
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
  const emojiHint = enableEmoji ? '<emoji> ' : ''
  const languageNote = language.includes('Chinese') ? ', add spaces between Chinese/English/numbers' : ''
  const customContent = customPrompt?.trim()
  const intro
    = outputMode === 'message-only'
      ? 'Commit message generator. Return ONLY the final commit message.'
      : 'Commit message generator guidelines for crafting the final commit message.'

  const formatSection: MarkdownSection = {
    title: 'Format',
    level: 3,
    content: `${emojiHint}<type>[scope]: <subject>
[body]
[BREAKING CHANGE: <desc>]

- Subject: imperative, ≤${COMMIT_FORMAT.MAX_SUBJECT_LENGTH} chars, no period
- Scope: optional, clarifies module/package
- Body: "- " bullets, ≤${COMMIT_FORMAT.MAX_BODY_LINE_LENGTH} chars/line, explain why/how; skip if obvious
- Breaking: add footer if backward incompatible`,
  }

  const rulesSection: MarkdownSection = {
    title: 'Rules',
    level: 3,
    content: bulletList([
      'Pick most specific type (priority: feat > fix > refactor > perf > docs/test/style)',
      'Empty diff → chore',
      'Revert: revert: <original type>(<scope>): <original subject>',
      `Language: ${language}${languageNote}`,
      'Keep types (feat/fix/etc), scope, identifiers, paths in English',
    ]),
  }

  const typesSection: MarkdownSection = {
    title: 'Types',
    level: 3,
    content: enableEmoji
      ? `${renderCommitTypes(true)}

Use the emoji shown for the chosen type as the prefix.`
      : renderCommitTypes(false),
  }

  return renderSections([
    { content: intro },
    typesSection,
    formatSection,
    rulesSection,
    optionalSection({
      title: 'Custom Rules (Override All Above)',
      level: 3,
      content: customContent ?? '',
    }, Boolean(customContent)),
  ])
}

/**
 * 生成统一的代码审查 + commit 消息提示词
 * @param diff Git diff 内容
 * @param mode 审查模式
 * @param options 可选配置
 * @param options.includeReview 是否包含代码审查流程，默认 true
 * @returns 聊天消息数组
 */
export async function generateReviewAndCommitPrompt(
  diff: string,
  mode: ReviewMode,
  options: { includeReview?: boolean } = {},
): Promise<ChatCompletionMessageParam[]> {
  const includeReview = options.includeReview ?? true
  const formatConfig = config.getFormatConfig()
  const commitConfig = config.getCommitConfig()
  const reviewConfig = config.getReviewConfig()

  const reviewGuidelines = includeReview
    ? createCodeReviewSystemContent(
        formatConfig.outputLanguage,
        mode,
        reviewConfig.customPrompt,
        { includeOutputShape: false },
      )
    : `Review is disabled. Always return the review object as:
{
  "passed": true,
  "severity": "info",
  "issues": [],
  "suggestions": []
}`

  const commitGuidelines = createCommitMessageSystemContent(
    formatConfig.outputLanguage,
    commitConfig.enableEmojiPrefix,
    commitConfig.customPrompt,
    { outputMode: 'guideline-only' },
  )

  const reviewSection = includeReview
    ? renderSections([
        { title: 'Task 1 — Code Review', level: 2, content: reviewGuidelines },
        { title: 'Task 2 — Commit Message', level: 2, content: commitGuidelines },
      ])
    : renderSections([
        { content: 'Review is disabled. Only craft the commit message.' },
        { title: 'Commit Message', level: 2, content: commitGuidelines },
      ])

  const severityList = bulletList([
    '"error": critical issues (syntax, security, data loss) → passed=false',
    '"warning": major issues (logic, error handling, resources) → passed=false',
    '"info": minor issues (code smells, style) → passed=false in strict mode only',
    'passed=true → severity="info", empty arrays',
  ])

  const disabledReviewJson = `{
  "review": {
    "passed": true,
    "severity": "info",
    "issues": [],
    "suggestions": []
  }
}`

  const outputConstraints = includeReview
    ? renderSections([{ title: 'Severity Rules', level: 2, content: severityList }])
    : renderSections([
        { title: 'Severity Rules', level: 2, content: 'Review is disabled. Always set:' },
        { content: disabledReviewJson },
      ])

  const systemContent = `# Code Review & Commit Message Generator

You are tasked with reviewing git diff changes and generating a Conventional Commit message.

${reviewSection}

## Output Format
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

${outputConstraints}`

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
