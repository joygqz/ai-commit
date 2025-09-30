import type { Progress } from 'vscode'
import { ProgressLocation, window } from 'vscode'

export class ProgressHandler {
  static async withProgress<T>(
    title: string,
    task: (progress: Progress<{ message?: string, increment?: number }>) => Promise<T>,
  ): Promise<T> {
    return window.withProgress(
      {
        location: ProgressLocation.Notification,
        title: `${title}`,
        cancellable: true,
      },
      task,
    )
  }
}
