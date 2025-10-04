import type { ChatCompletionMessageParam } from 'openai/resources'
import { config } from '../utils/config'

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
 * 审查模式类型
 */
export type ReviewMode = 'off' | 'lenient' | 'standard' | 'strict'

/**
 * 获取不同模式的审查严格程度描述
 * @param mode 审查模式
 * @returns 严格程度描述
 */
function getReviewModeGuidelines(mode: ReviewMode): string {
  switch (mode) {
    case 'lenient':
      return `## LENIENT Mode - CRITICAL Issues Only

**CHECK:**
• Syntax errors, undefined variables/functions, type errors, import errors
• Security: SQL injection, XSS, exposed secrets, auth bypass, weak crypto
• Data integrity: loss/corruption, schema changes without migration
• Crashes: null access, infinite loops, unhandled rejections, memory leaks

**IGNORE:** Style, performance, docs, edge cases, tests, non-crash logic bugs

**Result:** passed=false only if found CRITICAL (severity="error"), else passed=true (severity="info")`

    case 'standard':
      return `## STANDARD Mode - CRITICAL + MAJOR

**CRITICAL:** Syntax, security, crashes, data loss (lenient mode)

**MAJOR:**
• Logic: Wrong calculations, bad conditions, off-by-one, state errors
• Errors: Unhandled rejections, missing try-catch, swallowed errors
• Concurrency: Race conditions, missing locks, async state conflicts
• Breaking: API/schema changes without migration/deprecation
• Performance: O(n²) on >1000 items, N+1 queries, blocking >100ms
• Resources: Unclosed handles/connections/listeners/timers

**IGNORE:** Style, minor docs, unlikely edge cases, micro-optimizations

**Result:** passed=false if CRITICAL/MAJOR found, severity="error"(critical) or "warning"(major)`

    case 'strict':
      return `## STRICT Mode - Everything

**CRITICAL/MAJOR:** See standard mode

**MINOR:**
• Quality: Inconsistent naming, magic numbers, complexity >10, long functions, duplicates, dead code
• Types: \`any\` usage, missing null checks, implicit coercion, no input validation
• Docs: Missing JSDoc, unclear names, generic error messages
• Practices: Bad error handling, hardcoded values, no defensive programming
• Maintainability: Tight coupling, god objects, >5 params, callback hell
• Testing: Missing tests, uncovered edge cases

**Result:** passed=false if ANY issue found, severity="error"/"warning"/"info" by level`

    default:
      return ''
  }
}

/**
 * 创建代码 review 系统提示词
 * @param language review 结果的目标语言
 * @param mode 审查模式
 * @param customPrompt 自定义提示词（可选）
 * @returns 代码 review 系统提示词
 */
function createCodeReviewSystemContent(language: string, mode: ReviewMode = 'standard', customPrompt?: string): string {
  const modeGuidelines = getReviewModeGuidelines(mode)

  let content = `Senior code reviewer. Analyze git diff following mode rules strictly.

${modeGuidelines}

## Output Format (JSON ONLY)

{
  "passed": boolean,
  "severity": "error" | "warning" | "info",
  "issues": string[],
  "suggestions": string[]
}

**CRITICAL: All text in issues[] and suggestions[] arrays MUST be in ${language}**

Empty/whitespace/comment-only diffs: Pass with empty arrays.`

  // 如果有自定义提示词，添加到末尾
  if (customPrompt && customPrompt.trim()) {
    content += `\n\n## Custom Review Rules (Additional Focus)\n\n${customPrompt.trim()}`
  }

  return content
}

/**
 * 生成代码 review 聊天提示词
 * @param diff Git diff 内容
 * @param mode 审查模式
 * @returns 代码 review 提示词数组
 */
export async function generateCodeReviewPrompt(
  diff: string,
  mode: ReviewMode = 'standard',
): Promise<ChatCompletionMessageParam[]> {
  const formatConfig = config.getFormatConfig()
  const reviewConfig = config.getReviewConfig()
  const trimmedDiff = diff.trim() || '[empty diff provided]'

  return [
    {
      role: 'system',
      content: createCodeReviewSystemContent(formatConfig.outputLanguage, mode, reviewConfig.customPrompt),
    } satisfies ChatCompletionMessageParam,
    {
      role: 'user',
      content: trimmedDiff,
    } satisfies ChatCompletionMessageParam,
  ]
}
