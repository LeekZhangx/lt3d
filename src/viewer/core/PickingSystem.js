import * as THREE from 'three'

/**
 * 射线拾取系统（Picking System）
 *
 * 用于处理鼠标交互：
 * - hover（悬停检测）
 * - click（点击选中）
 * - 射线检测（Raycasting）
 *
 * 支持限制检测范围（targets），避免选中 helper / grid 等无关对象
 *
 * @example
 * const picking = new PickingSystem(camera, scene, renderer.domElement)
 *
 * picking.onClick = (obj) => {
 *   console.log('选中对象:', obj)
 * }
 *
 * picking.setTargets([modelRoot]) // 只检测模型
 */
export class PickingSystem {

  /**
   * 创建拾取系统
   *
   * @param {THREE.Camera} camera 相机（用于射线投射）
   * @param {THREE.Scene} scene 场景（默认检测范围）
   * @param {HTMLElement} domElement 监听鼠标事件的 DOM 元素（通常为 renderer.domElement）
   */
  constructor(camera, scene, domElement) {
    this.camera = camera
    this.scene = scene
    this.domElement = domElement

    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()

    this.currentIntersect = null
    this.selected = null

    this.targets = []

    this.enabled = true

    /* 回调 */
    this.onHover = null
    this.onClick = null

    this._bindEvents()
  }

  /* ================= 事件 ================= */

  _bindEvents() {
    this._onMouseMove = this._handleMouseMove.bind(this)
    this._onClick = this._handleClick.bind(this)

    this.domElement.addEventListener('mousemove', this._onMouseMove)
    this.domElement.addEventListener('click', this._onClick)
  }

  _handleMouseMove(event) {
    if (!this.enabled) return

    this._updateMouse(event)
    this._updateRaycast()

    const intersect = this._getFirstIntersect()

    if (intersect?.object !== this.currentIntersect?.object) {
      this.currentIntersect = intersect
      this.onHover?.(intersect?.object || null)
    }
  }

  _handleClick() {
    if (!this.enabled) return

    const intersect = this._getFirstIntersect()
    this.selected = intersect?.object || null

    this.onClick?.(this.selected)
  }

  /* ================= Raycast ================= */

  _updateMouse(event) {
    const rect = this.domElement.getBoundingClientRect()

    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
  }

  _updateRaycast() {
    this.raycaster.setFromCamera(this.mouse, this.camera)
  }

  _getFirstIntersect() {
    const list = this.targets.length ? this.targets : this.scene.children

    const intersects = this.raycaster.intersectObjects(list, true)
    return intersects[0] || null
  }

  /* ================= API ================= */

  setTargets(objects) {
    this.targets = objects
  }

  getSelected() {
    return this.selected
  }

  setEnabled(v) {
    this.enabled = v
  }

  /**
   * 销毁 PickingSystem（解绑事件 + 清理引用）
   */
  dispose() {

    // 1. 解绑 DOM 事件
    if (this.domElement) {
      this.domElement.removeEventListener('mousemove', this._onMouseMove)
      this.domElement.removeEventListener('click', this._onClick)
    }

    // 2. 清空状态
    this.currentIntersect = null
    this.selected = null

    // 3. 清空回调（防止外部闭包引用）
    this.onHover = null
    this.onClick = null

    // 4. 清空 targets
    this.targets.length = 0

    // 5. 清理对象引用
    this.raycaster = null
    this.mouse = null

    this.camera = null
    this.scene = null
    this.domElement = null

    // 6. 标记状态
    this.enabled = false
  }
}
