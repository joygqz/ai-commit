export class AbortManager {
  private currentController: AbortController | null = null

  /**
   * 创建一个新的 AbortController，如果已存在则先中止旧的
   * @returns 新的 AbortController
   */
  createController(): AbortController {
    // 如果存在旧的 controller，先中止它
    if (this.currentController) {
      this.currentController.abort()
    }

    // 创建新的 controller
    const controller = new AbortController()
    this.currentController = controller
    return controller
  }

  /**
   * 清理当前的 controller
   * @param controller 要清理的 controller，只有当它是当前 controller 时才清理
   */
  clear(controller: AbortController): void {
    if (this.currentController === controller) {
      this.currentController = null
    }
  }

  /**
   * 中止当前的操作
   */
  abort(): void {
    if (this.currentController) {
      this.currentController.abort()
      this.currentController = null
    }
  }

  /**
   * 获取当前是否有活动的 controller
   */
  get isActive(): boolean {
    return this.currentController !== null
  }
}
