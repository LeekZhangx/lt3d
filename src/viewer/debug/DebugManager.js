import * as THREE from 'three'
import { DebugGeometry } from './DebugGeometry.js'
import { DebugHelper } from './DebugHelper.js'
import { DebugMode } from './DebugMode.js'

/**
 * 几何体 Debug 管理器
 *
 * - 显示几何体的点、线、边框
 * - 显示场景网格、坐标轴 Helper
 */
export class DebugManager {

  /**
   * @param {THREE.Scene} scene
   */
  constructor(scene) {
    this.scene = scene

    this.geoState = {
      debugMode: DebugMode.NONE,
      depthTest: true,
      depthWrite: true,
      showModel: true,
      renderOrder: 999
    }

    this._box = new THREE.Box3()
    this._size = new THREE.Vector3()
    this._center = new THREE.Vector3()

    this.debugGeometry = new DebugGeometry(scene, this.geoState)
    this.debugHelper = new DebugHelper(scene)


  }

  setTarget(object) {
    if (!object) return

    this._box.setFromObject(object)
    this._box.getSize(this._size)
    this._box.getCenter(this._center)
  }

  /* ================= Geometry ================= */

  /**
   * @typedef {typeof DebugMode[keyof typeof DebugMode]} DebugModeType
   */

  /**
   * 设置几何体调试显示模式
   *
   * @param {DebugModeType} mode 调试模式 ,使用 DebugMode
   * @param {THREE.Object3D} object 目标对象
   * @returns
   *
   * @example
   * setDebugMode(DebugMode.WIREFRAME, mesh)
   * setDebugMode(DebugMode.NORMALS, group)
   */
  setDebugMode(mode, object) {
    this.debugGeometry.clear()
    if (!object) return

    this.geoState.debugMode = mode
    this.debugGeometry.enable(mode, object)

    object.visible = this.geoState.showModel
  }

  /**
   * 清空 DebugMode
   */
  clearDebugMode() {
    this.debugGeometry.clear()
  }

  updateDepth({ depthTest, depthWrite }) {
    this.geoState.depthTest = depthTest
    this.geoState.depthWrite = depthWrite

    this.debugGeometry.updateDepth({ depthTest, depthWrite })
  }

  /**
   * 更新渲染顺序，数值越小越先渲染
   *
   * @param {number} order
   */
  updateRenderOrder(order) {
    this.geoState.renderOrder = order
    this.debugGeometry.updateRenderOrder(order)
  }

  /**
   * 设置 目标几何体 是否展示
   *
   * @param {boolean} visible 是否展示
   * @param {THREE.Object3D} object
   */
  setShowModel(visible, object) {
    this.geoState.showModel = visible
    if (object) object.visible = visible
  }

  /* ================= Helper ================= */

  /**
   * 设置 地面网格 Helper
   *
   * @param {boolean} visible 是否展示
   */
  setGroundGridHelper(visible) {
    const position = new THREE.Vector3(
      this._center.x,
      0,
      this._center.z
    )

    this.debugHelper.enableGroundGridHelper(visible, {
      size: this._size,
      position
    })
  }

  /**
   * 设置 坐标轴 Helper
   *
   * @param {boolean} visible 是否展示
   */
  setAxesHelper(visible) {
    const maxVal = Math.max(
      this._size.x,
      this._size.y,
      this._size.z
    )

    this.debugHelper.enableAxesHelper(visible, {
      size: maxVal * 1.2
    })
  }

  /**
   * 设置 几何体边界 Helper
   *
   * @param {boolean} visible 是否展示
   * @param {THREE.Object3D} object 目标对象
   */
  setBorderHelper(visible, object) {
    this.debugHelper.enableBorderHelper(visible, object)
  }

  /**
   * 销毁 DebugManager（彻底卸载）
   */
  dispose() {

    // ==== Geometry ====

    this.debugGeometry?.dispose()
    this.debugGeometry = null


    // ==== Helper ====

    this.debugHelper?.dispose()
    this.debugHelper = null


    // ==== 清理引用 ====

    this.scene = null

    this._box = null
    this._size = null
    this._center = null

    this.geoState = null
  }
}
