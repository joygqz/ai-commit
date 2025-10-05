import type * as vscode from 'vscode'
import { commands, workspace } from 'vscode'
import * as Commands from './commands'
import { COMMANDS, EXTENSION_ID } from './utils/constants'
import { logger } from './utils/logger'
import { clearOpenAICache } from './utils/openai'
import { tokenTracker } from './utils/token-tracker'

/**
 * 扩展激活函数
 * @param context 扩展上下文，用于管理扩展的生命周期
 */
export function activate(context: vscode.ExtensionContext) {
  logger.info('Commit Genie extension activated')

  // 初始化 Token 状态栏
  const statusBarItem = tokenTracker.initialize()
  context.subscriptions.push(statusBarItem)

  /**
   * 监听配置变更
   */
  context.subscriptions.push(
    workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration(`${EXTENSION_ID}.service`)) {
        logger.debug('Service configuration changed, clearing OpenAI cache')
        clearOpenAICache()
      }
    }),
  )

  // 注册审查代码并生成 commit 消息命令
  context.subscriptions.push(
    commands.registerCommand(
      COMMANDS.REVIEW_AND_COMMIT,
      Commands.reviewAndCommit.bind(null, context),
    ),
    // 注册选择可用模型命令
    commands.registerCommand(
      COMMANDS.SELECT_AVAILABLE_MODEL,
      Commands.selectAvailableModel,
    ),
    // 注册显示 Token 统计命令
    commands.registerCommand(
      'commitGenie.showTokenStats',
      () => tokenTracker.showDetailedStats(),
    ),
  )
}

/**
 * 扩展注销函数
 */
export function deactivate() {
  logger.info('Commit Genie extension deactivated')
  tokenTracker.dispose()
  logger.dispose()
}
