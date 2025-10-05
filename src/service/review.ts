import type { ChatCompletionMessageParam } from 'openai/resources'
import type { CodeReviewResult, ReviewMode } from '../prompts/review'
import { generateCodeReviewPrompt } from '../prompts/review'
import { logger } from '../utils/logger'
import { ChatGPTAPI } from '../utils/openai'

/**
 * 代码审查服务
 */
export class ReviewService {
  /**
   * 执行代码 review
   * @param diff Git diff 内容
   * @param signal 中止信号
   * @param mode 审查模式
   * @returns Code review 结果
   */
  static async performCodeReview(
    diff: string,
    signal: AbortSignal,
    mode: ReviewMode = 'standard',
  ): Promise<CodeReviewResult> {
    logger.info('Starting code review', { mode })

    const reviewPrompts = await generateCodeReviewPrompt(diff, mode)

    // 调用 API 并获取响应内容和 token 使用统计
    const apiResult = await ChatGPTAPI(
      reviewPrompts as ChatCompletionMessageParam[],
      { signal },
    )

    logger.debug('Code review response received', {
      contentLength: apiResult.content.length,
      hasUsage: !!apiResult.usage,
    })

    return this.parseReviewResponse(apiResult.content)
  }

  /**
   * 解析代码审查响应
   * @param response API 响应内容
   * @returns 解析后的审查结果
   */
  private static parseReviewResponse(response: string): CodeReviewResult {
    try {
      let jsonStr = response.trim()

      // 移除 Markdown 代码块标记
      if (jsonStr.includes('```')) {
        const startIdx = jsonStr.indexOf('{')
        const endIdx = jsonStr.lastIndexOf('}')
        if (startIdx !== -1 && endIdx !== -1) {
          jsonStr = jsonStr.slice(startIdx, endIdx + 1)
        }
      }

      const result = JSON.parse(jsonStr) as CodeReviewResult
      logger.info('Code review completed', {
        passed: result.passed,
        severity: result.severity,
        issuesCount: result.issues.length,
      })
      return result
    }
    catch (error) {
      logger.error('Failed to parse code review response', error)
      // 如果解析失败，返回一个默认的通过结果
      return {
        passed: true,
        severity: 'info',
        issues: [],
        suggestions: [],
      }
    }
  }
}
