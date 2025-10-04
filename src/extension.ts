import * as vscode from 'vscode'
import { commands } from './commands'
import { name } from './utils/constants'

export function activate(context: vscode.ExtensionContext) {
  Object.entries(commands).forEach(([commandName, command]) => {
    const disposable = vscode.commands.registerCommand(`${name}.${commandName}`, command)
    context.subscriptions.push(disposable)
  })
}

export function deactivate() {}
