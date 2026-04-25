import * as THREE from 'three'

/**
 * 相机管理系统
 *
 * - 管理透视 / 正交相机
 * - 提供切换与视角控制
 */
export class CameraSystem {

  /**
   * @param {HTMLDivElement} container
   */
  constructor(container) {
    const width = container.clientWidth
    const height = container.clientHeight
    this.aspect = width / height

    /**
     * 相机观察的目标点
     * @type {THREE.Vector3}
     */
    this.target = new THREE.Vector3()

    this.perspective = this._createPerspective()
    this.orthographic = this._createOrthographic()

    /** 当前激活相机 */
    this.currentCamera = this.perspective
  }

  /** 创建透视相机 */
  _createPerspective() {
    const cam = new THREE.PerspectiveCamera(60, this.aspect, 0.1, 1000)
    cam.position.set(0, 1.5, 3)
    return cam
  }

  /** 创建正交相机 */
  _createOrthographic() {
    const size = 5
    const cam = new THREE.OrthographicCamera(
      -size * this.aspect,
      size * this.aspect,
      size,
      -size,
      0.1,
      1000
    )
    return cam
  }

  /** 获取当前相机 */
  getCamera() {
    return this.currentCamera
  }

  /** 切换为透视相机 */
  setPerspective() {
    this.currentCamera = this.perspective
  }

  /** 切换为正交相机 */
  setOrthographic() {
    this.currentCamera = this.orthographic
  }

  /**
   * 同步两个相机的视觉状态（双向）
   * 
   * @param {'perspective'|'orthographic'} targetType
   */
  syncCameras(targetType) {

    const p = this.perspective
    const o = this.orthographic

    const center = this.target

    let source, target

    if (targetType === 'orthographic') {
      source = p
      target = o
    } else {
      source = o
      target = p
    }

    // =========================
    // 同步方向
    // =========================
    target.quaternion.copy(source.quaternion)

    const dir = new THREE.Vector3()
    source.getWorldDirection(dir)

    // =========================
    // 透视 → 正交
    // =========================
    if (source.isPerspectiveCamera && target.isOrthographicCamera) {

      const distance = source.position.distanceTo(center)
      const fov = source.fov * Math.PI / 180

      const height = 2 * Math.tan(fov / 2) * distance
      const width = height * source.aspect

      target.top = height / 2
      target.bottom = -height / 2
      target.left = -width / 2
      target.right = width / 2

      target.zoom = 1
      target.updateProjectionMatrix()

      // 同步位置（围绕 center）
      target.position.copy(center).addScaledVector(dir.negate(), distance)
    }

    // =========================
    // 正交 → 透视
    // =========================
    if (source.isOrthographicCamera && target.isPerspectiveCamera) {

      const height = (source.top - source.bottom) / source.zoom

      const fov = target.fov * Math.PI / 180
      const distance = height / (2 * Math.tan(fov / 2))

      target.position.copy(center).addScaledVector(dir.negate(), distance)
      target.updateProjectionMatrix()
    }
}

  /**
   * resize 同步
   */
  resize(width, height) {

    const aspect = width / height

    // 透视
    this.perspective.aspect = aspect
    this.perspective.updateProjectionMatrix()

    // 正交
    const frustum = 10
    this.orthographic.left = -frustum * aspect
    this.orthographic.right = frustum * aspect
    this.orthographic.top = frustum
    this.orthographic.bottom = -frustum
    this.orthographic.updateProjectionMatrix()
  }

  /**
   * 模型包围信息
   * @typedef {Object} Bounds
   * @property {THREE.Vector3} size
   * @property {THREE.Vector3} center
   */

  /**
   * 根据包围信息调整相机
   * @param {Bounds} bounds
   * @returns {{ center: THREE.Vector3 }}
   */
  fit(bounds) {

    const { size, center } = bounds

    const cam = this.currentCamera

    // 保存 target
    this.target.copy(center)

    // =========================
    // 1. 方向（斜视）
    // =========================
    const dir = new THREE.Vector3(1, 1, 1).normalize()

    // =========================
    // 2. 用包围球算半径
    // =========================
    let radius = size.length() / 2

    radius = radius * 1.2

    // =========================
    // 3. 根据相机类型算 distance
    // =========================

    let distance

    if (cam.isPerspectiveCamera) {

      const fov = cam.fov * Math.PI / 180

      distance = radius / Math.sin(fov / 2)

    } else {

      // 正交：不靠 distance 控制，而是 zoom
      const aspect = (cam.right - cam.left) / (cam.top - cam.bottom)

      const fitHeight = size.y
      const fitWidth = size.x / aspect

      const fitSize = Math.max(fitHeight, fitWidth)

      const padding = 4

      cam.zoom = (cam.top - cam.bottom) / (fitSize * padding)
      cam.updateProjectionMatrix()

      // distance 只用来“放置位置”
      distance = radius * 2
    }

    // =========================
    // 4. 设置位置
    // =========================
    cam.position.copy(center).addScaledVector(dir, distance)

    cam.lookAt(center)

    return { center }
  }

  /**
   * 设置标准视角（正交常用）
   * @param {'top'|'bottom'|'front'|'back'|'left'|'right'} dir
   * @param {Bounds} bounds
   */
  setView(dir, { center, size }) {
    const cam = this.currentCamera
    const d = Math.max(size.x, size.y, size.z) * 2

    switch (dir) {
      case 'top':    cam.position.set(center.x, center.y + d, center.z); break
      case 'bottom': cam.position.set(center.x, center.y - d, center.z); break
      case 'front':  cam.position.set(center.x, center.y, center.z + d); break
      case 'back':   cam.position.set(center.x, center.y, center.z - d); break
      case 'left':   cam.position.set(center.x - d, center.y, center.z); break
      case 'right':  cam.position.set(center.x + d, center.y, center.z); break
    }

    cam.lookAt(center)
  }

  /**
   * 释放相机系统资源
   *
   * THREE.Camera 本身不需要 dispose（没有 GPU 资源）
   */
  dispose() {

    // 当前相机引用
    this.currentCamera = null

    this.target = null

    // 两个相机（仅断引用，帮助 GC）
    this.perspective = null
    this.orthographic = null

    // 其他状态
    this.aspect = null
  }

}