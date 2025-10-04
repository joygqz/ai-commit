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

**ONLY report if VISIBLE in diff:**
• Syntax errors: incomplete code, mismatched brackets, invalid syntax
• Obvious bugs: accessing undefined vars/props, wrong operators, clear null/undefined errors
• Security: hardcoded secrets/keys/passwords, SQL string concat, direct HTML insertion
• Fatal errors: infinite loops (while(true) no break), missing await on Promise, unhandled rejection

**IGNORE:** Everything else including style, performance, logic that needs context, assumptions

**Rule:** IF no obvious evidence in diff → PASS. Uncertainty → PASS.

**Result:** passed=false only if CRITICAL found with clear evidence (severity="error")`

    case 'standard':
      return `## STANDARD Mode - CRITICAL + MAJOR

**CRITICAL (must be visible in diff):**
• Syntax/runtime errors: clear bugs, type mismatches, undefined usage
• Security: exposed credentials, injection vulnerabilities, insecure patterns
• Data risks: deleting without checks, overwriting without backup, breaking migrations

**MAJOR (must be visible in diff):**
• Logic errors: obvious wrong calculations (e.g., + instead of *), incorrect conditions
• Error handling: try-catch removing useful errors, ignoring Promise rejections
• Resource leaks: opening files/connections without closing (clear in same function)
• Breaking changes: removing public APIs, incompatible signature changes

**IGNORE:** Anything requiring full codebase context, assumptions, style, minor issues

**Rule:** IF not 100% certain from diff alone → PASS. Doubt → PASS.

**Result:** passed=false if CRITICAL/MAJOR with evidence, severity="error"/"warning"`

    case 'strict':
      return `## STRICT Mode - All Verifiable Issues

**CRITICAL/MAJOR:** See standard mode (must be visible in diff)

**MINOR (must be visible in diff):**
• Clear code smells: magic numbers without context, obvious duplicates, dead code in diff
• Type issues: using \`any\` in new code, missing null checks on nullable values
• Bad practices: hardcoded URLs/paths, console.log in production code, empty catch blocks
• Obvious complexity: 100+ line functions, deeply nested conditions (>4 levels)

**IGNORE:** Style preferences, naming debates, architectural opinions, hypothetical issues

**Rule:** Report ONLY what you can prove from the diff. NO assumptions, NO guessing.

**Result:** passed=false if ANY verifiable issue found, severity by level`

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

  let content = `Senior code reviewer. Analyze ONLY what's visible in the git diff.

${modeGuidelines}

## Core Principles

**EVIDENCE REQUIRED:** Report ONLY issues you can prove from the diff itself
**NO ASSUMPTIONS:** Don't guess about missing context, external code, or implementation details  
**NO SPECULATION:** "This might cause..." or "Could be a problem..." → PASS
**WHEN IN DOUBT:** Pass. Lack of evidence = Pass.

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
