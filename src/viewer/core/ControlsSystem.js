import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

/**
 * 相机控制系统（Controls System）
 *
 * 基于 OrbitControls 封装，用于控制相机的旋转、缩放和平移。
 * 提供统一的 update / enable / 事件监听接口，方便与渲染系统解耦。
 *
 * 常用于：
 * - 场景浏览（Orbit）
 * - 与 GUI 联动（如 autoRotate / damping）
 * - 与交互系统协作（如拖拽时禁用控制）
 *
 * @example
 * const controlsSystem = new ControlsSystem(camera, renderer.domElement)
 *
 * controlsSystem.onChange(() => {
 *   renderer.render(scene, camera)
 * })
 *
 * function render() {
 *   controlsSystem.update()
 *   renderer.render(scene, camera)
 * }
 */
export class ControlsSystem {

  /**
   * 创建相机控制系统
   *
   * @param {Object} options
   * @param {THREE.Camera} [options.camera] 相机
   * @param {HTMLElement} [options.domElement] DOM元素（renderer.domElement）
   * @param {OrbitControls} [options.controls] 外部传入控制器（可选）
   */
  constructor({ camera, domElement, controls } = {}) {

    /** @type {THREE.Camera|null} */
    this.camera = camera || null

    /** @type {HTMLElement|null} */
    this.domElement = domElement || null

    /** @type {OrbitControls|null} */
    this.controls = null

    /** 是否启用 */
    this.enabled = true

    // 优先使用外部传入 controls
    if (controls) {
      this.controls = controls
    } else if (camera && domElement) {
      this._createControls(camera, domElement)
    }
  }

  /**
   * 创建默认的控制器 OrbitControls
   *
   * @param {THREE.Camera} camera
   * @param {HTMLElement} domElement
   */
  _createControls(camera, domElement) {
    this.controls = new OrbitControls(camera, domElement)
    this.controls.enableDamping = false
  }

  /**
   * 固定控制器中心位置
   * 
   * 在模型更新后调用
   * 
   * @param {THREE.Vector3} center 
   * @returns 
   */
  fitCenter(center) {
    if (!this.controls) return

    this.controls.target.copy(center)
    this.controls.update()
  }

  /* =========================
     每帧更新（必须在 render loop 调用）
  ========================= */

  update() {
    if (!this.enabled || !this.controls) return
    this.controls.update()
  }

  /* =========================
     替换相机（关键能力）
  ========================= */

  /**
   * 替换控制器绑定的相机
   * - 不会重建 controls
   * - 无位置跳变
   * 
   * @param {THREE.Camera} newCamera
   */
  setCamera(newCamera) {
    if (this.camera === newCamera) return

      const oldCamera = this.camera

      // 保存当前状态
      const target = this.controls.target.clone()

      const offset = oldCamera.position.clone().sub(target)
      const distance = offset.length()

      // 替换相机
      this.camera = newCamera
      this.controls.object = newCamera

      // 恢复 target
      this.controls.target.copy(target)

      // 重新设置位置 避免位置跳变
      const dir = offset.normalize()

      newCamera.position.copy(target).add(dir.multiplyScalar(distance))
      newCamera.lookAt(target)

      // 更新 controls
      this.controls.update()
  }

  /* =========================
     替换控制器（关键能力）
  ========================= */

  /**
   * 完全替换控制器（如 Orbit → Fly）
   * @param {*} controls
   */
  setControls(controls) {
    if (this.controls) {
      this.controls.dispose?.()
    }

    this.controls = controls
  }

  /* =========================
     重建 OrbitControls（可选）
  ========================= */

  /**
   * 使用当前 camera + domElement 重新创建 OrbitControls
   */
  rebuild() {
    if (!this.camera || !this.domElement) return

    if (this.controls) {
      this.controls.dispose?.()
    }

    this._createControls(this.camera, this.domElement)
  }

  /* =========================
     启用 / 禁用
  ========================= */

  /**
   * @param {boolean} enabled
   */
  setEnabled(enabled) {
    this.enabled = enabled

    if (this.controls) {
      this.controls.enabled = enabled
    }
  }

  /* =========================
     事件监听
  ========================= */

  /**
   * 相机变化事件
   * @param {Function} callback
   */
  onChange(callback) {
    this.controls?.addEventListener('change', callback)
  }

  /* =========================
     获取实例
  ========================= */

  /**
   * 获取原始 controls
   */
  get() {
    return this.controls
  }

  /**
   * 销毁 ControlsSystem（释放事件 + 清理引用）
   */
  dispose() {

    // 1. 销毁 controls
    if (this.controls) {
      this.controls.dispose?.()
    }

    // 2. 清理引用
    this.controls = null
    this.camera = null
    this.domElement = null

    // 3. 状态重置
    this.enabled = false
  }
}
