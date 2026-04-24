import { DebugManager } from './DebugManager.js'
import { DebugMode } from './DebugMode.js'

export class DebugController {

  /**
   * @param {DebugManager} debugManager
   * @param {() => void} requestRender
   */
  constructor(debugManager, requestRender) {
    this.debugManager = debugManager
    this.requestRender = requestRender
  }
  
  getGeoState(){
    return this.debugManager.geoState
  }

  getHelperState(){
    return this.debugManager.helperState
  }

  /* =========================
     Geometry
  ========================= */

  /**
   * 
   * @param {keyof typeof DebugMode} mode 
   */
  setDebugMode(mode) {
    this.debugManager.setDebugMode(mode)
    this.requestRender()
  }

  updateDepth(state) {
    this.debugManager.updateDepth(state)
    this.requestRender()
  }

  updateRenderOrder(val) {
    this.debugManager.updateRenderOrder(val)
    this.requestRender()
  }

  setShowModel(val) {
    this.debugManager.setShowModel(val)
    this.requestRender()
  }

  /* =========================
     Helper
  ========================= */

  setGroundGridHelper(v) {
    this.debugManager.setGroundGridHelper(v)
    this.requestRender()
  }

  setAxesHelper(v) {
    this.debugManager.setAxesHelper(v)
    this.requestRender()
  }

  setBorderHelper(v) {
    this.debugManager.setBorderHelper(v, this.debugManager.getBox())
    this.requestRender()
  }

  setOriginHelper(v) {
    this.debugManager.setOriginHelper(v)
    this.requestRender()
  }

  /* =========================
     Init Sync
  ========================= */

  /**
   * 按照状态激活一次相应的控件
   *
   * GUI创建控件和绑定事件，不会激活一次方法，需要手动同步初始化状态
   *
   * @param {object} geoState
   * @param {object} helperState
   */
  applyDebugState(geoState, helperState) {

    this.debugManager.setDebugMode(geoState.debugMode)
    this.debugManager.updateDepth(geoState)
    this.debugManager.updateRenderOrder(geoState.renderOrder)
    this.debugManager.setShowModel(geoState.showModel)

    this.debugManager.setGroundGridHelper(helperState.showGroundGrid)
    this.debugManager.setAxesHelper(helperState.showAxes)
    this.debugManager.setBorderHelper(helperState.showBorder, this.debugManager.getBox())
    this.debugManager.setOriginHelper(helperState.showOrigin)

    this.requestRender()
  }

  /**
   * 清理引用，不销毁引用的各个系统
   */
  dispose(){
    this.debugManager = null
    this.requestRender = null
  }
}