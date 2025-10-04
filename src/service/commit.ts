import type { ChatCompletionMessageParam } from 'openai/resources'
import type { InputBox } from 'vscode'
import { l10n } from 'vscode'
import { generateCommitMessageChatCompletionPrompt } from '../prompts/commit'
import { logger } from '../utils/logger'
import { ChatGPTStreamAPI } from '../utils/openai'

/**
 * 提交消息生成服务
 */
export class CommitMessageService {
  /**
   * 生成并流式输出 commit 消息到 SCM 输入框
   * @param diff Git diff 内容
   * @param inputBox SCM 输入框
   * @param signal 中止信号
   */
  static async generateCommitMessage(
    diff: string,
    inputBox: InputBox,
    signal: AbortSignal,
  ): Promise<void> {
    logger.info('Starting commit message generation')

    // 验证输入
    if (!diff || diff === l10n.t('No staged changes.')) {
      throw new Error(l10n.t('No staged changes to generate commit message.'))
    }

    const messagePrompts = await generateCommitMessageChatCompletionPrompt(diff)
    logger.debug('Generated message prompts', { promptCount: messagePrompts.length })

    // 清空输入框并开始流式生成
    inputBox.value = ''

    await ChatGPTStreamAPI(
      messagePrompts as ChatCompletionMessageParam[],
      (chunk: string) => {
        if (!signal.aborted) {
          inputBox.value += chunk
        }
      },
      { signal },
    )

    if (!signal.aborted) {
      logger.info('Commit message generated successfully', { messageLength: inputBox.value.length })
    }
    else {
      logger.info('Commit message generation was aborted')
    }
  }
}
