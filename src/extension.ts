import type * as vscode from 'vscode'
import { commands, workspace } from 'vscode'
import * as Commands from './commands'
import { COMMANDS, EXTENSION_ID } from './utils/constants'
import { logger } from './utils/logger'
import { clearOpenAICache } from './utils/openai'

/**
 * 扩展激活函数
 * @param context 扩展上下文，用于管理扩展的生命周期
 */
export function activate(context: vscode.ExtensionContext) {
  // 初始化日志系统
  logger.initFromConfig()
  logger.info('Commit Genie extension activated')

  /**
   * 监听配置变更
   */
  context.subscriptions.push(
    workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration(`${EXTENSION_ID}.service`)) {
        logger.debug('Service configuration changed, clearing OpenAI cache')
        clearOpenAICache()
      }
      if (e.affectsConfiguration(`${EXTENSION_ID}.debug`)) {
        logger.debug('Debug configuration changed, reinitializing logger')
        logger.initFromConfig()
      }
    }),
  )

  // 注册生成 commit 消息命令
  context.subscriptions.push(
    commands.registerCommand(
      COMMANDS.GENERATE_COMMIT_MESSAGE,
      Commands.generateCommitMessage.bind(null, context),
    ),
    // 注册选择可用模型命令
    commands.registerCommand(
      COMMANDS.SELECT_AVAILABLE_MODEL,
      Commands.selectAvailableModel,
    ),
  )
}

/**
 * 扩展注销函数
 */
export function deactivate() {
  logger.info('Commit Genie extension deactivated')
  logger.dispose()
}
