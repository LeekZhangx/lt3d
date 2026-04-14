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
   * @param {()=>THREE.Object3D} getModel 获取模型对象的函数
   */
  constructor(scene, getModel) {
    this.scene = scene

    this.geoState = {
      debugMode: DebugMode.NONE,
      depthTest: true,
      depthWrite: true,
      showModel: true,
      renderOrder: 999
    }

    this.helperState = {
      showGroundGrid: false,
      showAxes: false,
      showBorder: false,
      showOrigin: false
    }

    this._getModel = getModel
    //模型的空间信息获取方法
    this._getBox = null
    this._getSize = null
    this._getCenter = null

    this.debugGeometry = new DebugGeometry(scene, this.geoState)
    this.debugHelper = new DebugHelper(scene)

  }

  /**
   * 注入模型空间信息能力
   * 
   * @param {Object} params 
   * @param {()=>THREE.Box3} params.getBox 提供模型包围盒的函数
   * @param {()=>THREE.Vector3} params.getSize 提供模型尺寸的函数
   * @param {()=>THREE.Vector3} params.getCenter 提供模型中心位置的函数
   */
  setModelProvider({ getBox, getSize, getCenter }) {
    this._getBox = getBox
    this._getSize = getSize
    this._getCenter = getCenter
  }

  /**
   * 获取模型的包围盒
   *
   * @returns {THREE.Box3}
   */
  getBox(){
    if (!this._getBox) {
      console.warn('SceneManager: getBox not provided')
      return null
    }
    return this._getBox()
  }

  /**
   * 获取模型包围盒尺寸
   *
   * @returns {THREE.Vector3}
   */
  getSize(){
    if (!this._getSize) {
      console.warn('SceneManager: getSize not provided')
      return null
    }
    return this._getSize()
  }

  /**
   * 获取模型包围盒中心位置
   *
   * @returns {THREE.Vector3}
   */
  getCenter(){
    if (!this._getCenter) {
      console.warn('SceneManager: getCenter not provided')
      return null
    }
    return this._getCenter()
  }

  /* ================= Geometry ================= */

  /**
   * @typedef {typeof DebugMode[keyof typeof DebugMode]} DebugModeType
   */

  /**
   * 设置几何体调试显示模式
   *
   * @param {DebugModeType} mode 调试模式 ,使用 DebugMode
   * @returns
   *
   * @example
   * setDebugMode(DebugMode.WIREFRAME)
   * setDebugMode(DebugMode.NORMALS)
   */
  setDebugMode(mode) {
    const object = this._getModel()
    this.debugGeometry.clear()
    if (!object) return

    this.geoState.debugMode = mode
    this.debugGeometry.enable(mode, object)

    object.visible = this.geoState.showModel
  }

  /**
   * 更新几何体调试显示模式，让debug显示适配新的模型
   * 
   * 在模型发生更新后调用，会清除先前模型的所有缓存
   */
  updateDebugMode(){    
    const object = this._getModel()
    this.debugGeometry.clear()
    if (!object) return

    const mode = this.geoState.debugMode
    this.debugGeometry.update(mode, object)

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
    this.helperState.showGroundGrid = visible

    const center = this.getCenter()
    const size = this.getSize()

    const position = new THREE.Vector3(
      center.x,
      0,
      center.z
    )

    this.debugHelper.enableGroundGridHelper(visible, {
      size,
      position
    })
  }

  /**
   * 设置 坐标轴 Helper
   *
   * @param {boolean} visible 是否展示
   */
  setAxesHelper(visible) {
    this.helperState.showAxes = visible

    const size = this.getSize()

    const maxVal = Math.max(
      size.x,
      size.y,
      size.z
    )

    this.debugHelper.enableAxesHelper(visible, {
      size: maxVal * 2
    })
  }

  /**
   * 设置 几何体边界 Helper
   *
   * @param {boolean} visible 是否展示
   * @param {THREE.Object3D} object 目标对象
   */
  setBorderHelper(visible, object) {
    this.helperState.showBorder = visible

    this.debugHelper.enableBorderHelper(visible, object)
  }

  /**
   * 设置 坐标原点(0,0,0)显示 Helper
   *
   * @param {boolean} visible 是否展示
   * @param {Object} params 
   */
  setOriginHelper(visible, params) {
    this.helperState.showOrigin = visible

    this.debugHelper.enableOriginHelper(visible, params)
  }

  /**
   * 更新 Debug 可视化
   *
   * 在模型更新后调用
   */
  updateDebugItems() {
    const size = this.getSize()
    const center = this.getCenter()

    const position = new THREE.Vector3(center.x, 0, center.z)

    // ===== geometry =====
    this.updateDebugMode()

    // ===== helper =====
    if (this.helperState.showGroundGrid) {
      this.debugHelper.updateGroundGrid({
        size,
        position
      })
    }

    if (this.helperState.showBorder) {
    
      const box = this.getBox()

      this.debugHelper.updateBorderHelper(box)
    }

    if (this.helperState.showAxes) {
      const max = Math.max(size.x, size.y, size.z)

      this.debugHelper.updateAxesHelper({
        size: max * 2
      })
    }

    // Border / Origin 通常跟 object 绑定，不需要全局刷新
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

    this._getModel = null
    this._getBox = null
    this._getSize = null
    this._getCenter = null

    this.geoState = null
  }
}
