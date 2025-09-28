import type { Progress } from 'vscode'
import { useLogger } from 'reactive-vscode'
import { ProgressLocation, window } from 'vscode'
import { displayName } from './generated/meta'

export const logger = useLogger(displayName)

export function addPeriodIfMissing(str: string) {
  return str.replace(/[^.?!。？！…]$/, '$&.')
}

export class ProgressHandler {
  static async withProgress<T>(
    title: string,
    task: (
      progress: Progress<{ message?: string, increment?: number }>
    ) => Promise<T>,
  ): Promise<T> {
    return window.withProgress(
      {
        location: ProgressLocation.Notification,
        title: `${title}`,
      },
      task,
    )
  }
}
