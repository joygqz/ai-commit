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
}

/**
 * 审查和提交结果接口
 */
export interface ReviewAndCommitResult {
  review: CodeReviewResult
  commitMessage: string
}

/**
 * 生成统一的代码审查 + commit 消息提示词
 * @param diff Git diff 内容
 * @returns 聊天消息数组
 */
export async function generateReviewAndCommitPrompt(
  diff: string,
): Promise<ChatCompletionMessageParam[]> {
  const formatConfig = config.getFormatConfig()
  const commitConfig = config.getCommitConfig()
  const reviewConfig = config.getReviewConfig()

  const trimmedDiff = diff.trim() || '[empty diff provided]'

  // 构建语言提示
  const isChinese = formatConfig.outputLanguage.includes('中文')
  const languageNote = isChinese ? ' 请在中文与英文或数字之间保留空格。' : ''

  // 构建提交类型列表
  const commitTypes = [
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
  ]

  const commitTypesList = commitTypes
    .map(({ type, description, emoji }) => {
      const prefix = commitConfig.enableEmojiPrefix ? `${emoji} ` : ''
      return `  - ${prefix}${type}: ${description}`
    })
    .join('\n')

  const emojiInstruction = commitConfig.enableEmojiPrefix
    ? 'Prefix the subject with the matching emoji from the list above.'
    : 'Do not prefix the subject with emojis.'

  // 自定义提示
  const reviewCustomPrompt = reviewConfig.customPrompt.trim()
  const commitCustomPrompt = commitConfig.customPrompt.trim()

  const systemContent = `You are a code review and commit message generator. Analyze git diff changes and produce both review feedback and a Conventional Commit message.

CRITICAL: ALL text output (review issues, suggestions, commit message) MUST be in ${formatConfig.outputLanguage}.${languageNote} ONLY technical terms (commit types like feat/fix, code identifiers, file paths) remain in English.

## Task 1 — Code Review

Review ONLY what's visible in the diff. Check for:
  - obvious syntax errors (missing brackets, quotes, semicolons, commas)
  - clear type mismatches visible in the diff code

Rules:
- Report ONLY errors you can directly see in the diff code
- When in doubt or lacking context, pass the review (set passed=true)
- DO NOT report: undefined variables/functions (you can't see full context), code style, logic bugs, performance, code smells, potential issues
- Set passed=false ONLY when you see clear, obvious syntax errors
- Default behavior: passed=true, issues=[], suggestions=[]
- Each issue MUST include short description and affected files/symbols
- Write ALL descriptions in ${formatConfig.outputLanguage}${reviewCustomPrompt
  ? `

Additional review guidance:
${reviewCustomPrompt}`
  : ''}

## Task 2 — Commit Message

Format: type(scope): subject

Subject line rules:
- Follow Conventional Commits specification
- Structure: type(scope): subject
- Supported types:
${commitTypesList}
- ${emojiInstruction}
- Use imperative mood (e.g., "add" not "added" or "adds")
- Max ${COMMIT_FORMAT.MAX_SUBJECT_LENGTH} characters
- No period at the end
- Lowercase first letter after colon
- Be specific and concise about WHAT changed
- Write in ${formatConfig.outputLanguage}

Body rules (optional, add only when needed):
- Separate from subject with ONE blank line
- MUST use bullet point format: each line starts with "- "
- Wrap at ${COMMIT_FORMAT.MAX_BODY_LINE_LENGTH} characters per line
- Explain WHY the change was made, not HOW
- Include context, motivation, or consequences
- Write in ${formatConfig.outputLanguage}

When to include body:
- Complex changes needing explanation
- Breaking changes (BREAKING CHANGE: ...)
- Multiple related changes
- Important context or reasoning

When to skip body:
- Simple, self-explanatory changes
- Single-line fixes
- Trivial updates${commitCustomPrompt
  ? `

Additional commit guidance:
${commitCustomPrompt}`
  : ''}

## Output Format

Return JSON (no markdown fences):

Simple change example:
{
  "review": {
    "passed": true,
    "issues": [],
    "suggestions": []
  },
  "commitMessage": "feat(auth): add OAuth2 support"
}

Complex change example with body (body MUST use "- " format):
{
  "review": {
    "passed": true,
    "issues": [],
    "suggestions": []
  },
  "commitMessage": "feat(auth): add OAuth2 support\n\n- implement OAuth2 authentication flow for third-party login\n- add support for Google and GitHub providers\n- improve security with token-based authentication\n- enhance user experience with social login options"
}

Remember: Set review.passed based on findings. ALL text content MUST be in ${formatConfig.outputLanguage}.`

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
