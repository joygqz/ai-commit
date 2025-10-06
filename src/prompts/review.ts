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
 * @returns 代码 review 系统提示词
 */
function createCodeReviewSystemContent(language: string, mode: ReviewMode = 'standard', customPrompt?: string): string {
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

## Output JSON
{
  "passed": boolean,
  "severity": "error" | "warning" | "info",
  "issues": string[],
  "suggestions": string[]
}

Language: ${language}. For Chinese, add spaces between Chinese/English/numbers.

Empty diff → pass with empty arrays.`

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
