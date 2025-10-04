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
      return `## LENIENT Mode - CRITICAL Only

**Report if VISIBLE in diff:**
• Syntax errors, undefined vars/props, wrong operators
• Security: hardcoded secrets, SQL concat, HTML injection
• Fatal: infinite loops, missing await, unhandled rejection

**Rule:** No evidence → PASS. Uncertainty → PASS.
**Result:** passed=false only if CRITICAL (severity="error")`

    case 'standard':
      return `## STANDARD Mode - CRITICAL + MAJOR

**CRITICAL (visible in diff):**
• Syntax/runtime errors, type mismatches, undefined usage
• Security: exposed credentials, injection vulnerabilities
• Data risks: deleting without checks, breaking migrations

**MAJOR (visible in diff):**
• Logic errors: wrong calculations, incorrect conditions
• Error handling: removing useful errors, ignoring rejections
• Resource leaks: unclosed files/connections
• Breaking changes: removing APIs, incompatible signatures

**Rule:** Not 100% certain → PASS. Doubt → PASS.
**Result:** passed=false if found, severity="error"/"warning"`

    case 'strict':
      return `## STRICT Mode - All Verifiable

**CRITICAL/MAJOR:** See standard mode

**MINOR (visible in diff):**
• Code smells: magic numbers, duplicates, dead code
• Type issues: \`any\` usage, missing null checks
• Bad practices: hardcoded paths, console.log, empty catch
• Complexity: 100+ line functions, >4 nested levels

**Rule:** Report ONLY provable from diff. NO assumptions.
**Result:** passed=false if ANY found, severity by level`

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

  let content = `Code reviewer. Analyze ONLY visible in git diff.

${modeGuidelines}

## Principles
**Evidence required:** Report ONLY provable issues
**No assumptions:** Don't guess missing context
**When in doubt:** Pass

## Output (JSON)
{
  "passed": boolean,
  "severity": "error" | "warning" | "info",
  "issues": string[],
  "suggestions": string[]
}

**Language:** ${language} (space between Chinese/English/numbers)

Empty diffs: Pass with empty arrays.`

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
