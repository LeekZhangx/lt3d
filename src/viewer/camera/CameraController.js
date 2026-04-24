export class CameraController {

  /**
   * @param {Object} params
   * @param {CameraSystem} params.cameraSystem
   * @param {ControlsSystem} params.controlsSystem
   * @param {RenderSystem} params.renderSystem
   * @param {() => void} params.requestRender
   */
  constructor({
    cameraSystem,
    controlsSystem,
    renderSystem,
    requestRender
  }) {
    this.cameraSystem = cameraSystem
    this.controlsSystem = controlsSystem
    this.renderSystem = renderSystem
    this.requestRender = requestRender
  }

  /* =========================
     状态获取（给 Panel）
  ========================= */

  getType() {
    return this.cameraSystem.getCamera().isPerspectiveCamera
      ? 'perspective'
      : 'orthographic'
  }

  /* =========================
     相机切换（核心逻辑）
  ========================= */

  switchCamera(type) {

    // 同步两个相机（防跳）
    this.cameraSystem.syncCameras(type)

    // 切换
    if (type === 'perspective') {
      this.cameraSystem.setPerspective()
    } else {
      this.cameraSystem.setOrthographic()
    }

    const camera = this.cameraSystem.getCamera()

    //  通知 controls
    this.controlsSystem.setCamera(camera)

    // 通知 renderer
    this.renderSystem.setCamera(camera)

    // 触发渲染
    this.requestRender?.()
  }

  /* =========================
     进阶能力（后面你一定会用）
  ========================= */

  fit(bounds) {
    const result = this.cameraSystem.fit(bounds)
    this.requestRender?.()
    return result
  }

  setView(dir, bounds) {
    this.cameraSystem.setView(dir, bounds)
    this.requestRender?.()
  }

  resize(width, height) {
    this.cameraSystem.resize(width, height)
    this.requestRender?.()
  }

  /* ========================= */

  getCamera() {
    return this.cameraSystem.getCamera()
  }

  /**
   * 清理引用，不销毁引用的各个系统
   */
  dispose() {
    this.cameraSystem = null
    this.controlsSystem = null
    this.renderSystem = null
    this.requestRender = null
  }
}