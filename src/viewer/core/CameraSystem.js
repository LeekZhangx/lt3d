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
   * 同步两个相机的“视觉状态”
   */
  syncCameras() {

    const p = this.perspective
    const o = this.orthographic

    // 方向一致
    o.position.copy(p.position)
    o.quaternion.copy(p.quaternion)

    // 关键：匹配视野尺寸（避免跳变）
    
    const distance = p.position.length()
    const fov = p.fov * Math.PI / 180

    const height = 2 * Math.tan(fov / 2) * distance

    o.top = height / 2
    o.bottom = -height / 2
    o.right = (height * p.aspect) / 2
    o.left = -(height * p.aspect) / 2

    o.updateProjectionMatrix()
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
  fit({ size, center }) {
    const cam = this.currentCamera

    const max = Math.max(size.x, size.y, size.z)

    if (cam.isPerspectiveCamera) {
      const distance = max / Math.tan((cam.fov * Math.PI / 180) / 2)
      cam.position.copy(center).addScalar(distance)
    }

    if (cam.isOrthographicCamera) {
      cam.zoom = 1 / (max * 0.2)
      cam.updateProjectionMatrix()

      cam.position.copy(center).add(new THREE.Vector3(0, max, 0))
    }

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

    // 两个相机（仅断引用，帮助 GC）
    this.perspective = null
    this.orthographic = null

    // 其他状态
    this.aspect = null
  }

}