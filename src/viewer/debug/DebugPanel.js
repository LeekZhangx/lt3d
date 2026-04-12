import { GUI } from 'lil-gui'
import { DebugMode } from './DebugMode'
import { DebugManager } from './DebugManager'
import { GuiTheme } from '../util/GuiTheme'

/**
 * 几何体 Debug GUI 控制面板
 */
export class DebugPanel {

  /**
   * 实例化 几何体 Debug GUI 控制面板
   * @param {DebugManager} debugManager
   */
  constructor(debugManager) {
    this.debugManager = debugManager
    this.gui = null

    /**
     * 当前GUI是否显示
     */
    this.isShow = false
    this.getModel = null
  }

  /**
   * 启用 GUI
   *
   * @param {() => THREE.Object3D | null} getModel 获取当前模型对象的方法（懒获取，避免缓存过期）
   * @param {HTMLDivElement} container GUI 挂载的 DOM 容器
   * @param {() => void} requestRender 请求重新渲染的方法（用于 GUI 改变后刷新画面）
   * @param {keyof GuiTheme.THEME} guiTheme gui主题， 获取自 GuiTheme.THEME
   * @returns {void}
   */
  enableGUI(getModel, container, requestRender, guiTheme) {
    if (this.gui) {
      this.showGUI()
      return
    }

    this.getModel = getModel

    this.gui = new GUI({
      title: 'Debug',
      container
    })

    const geoState = this.debugManager.geoState

    /* ========= Geometry ========= */
    const geoFolder = this.gui.addFolder('Geometry')
    geoFolder.close()

    geoFolder.add(geoState, 'debugMode', Object.values(DebugMode))
      .onChange((val) => {
        const obj = this.getModel()
        this.debugManager.setTarget(obj)
        this.debugManager.setDebugMode(val, obj)
        requestRender?.()
      })

    geoFolder.add(geoState, 'depthTest')
      .onChange(() => {
        this.debugManager.updateDepth(geoState)
        requestRender?.()
      })

    geoFolder.add(geoState, 'depthWrite')
      .onChange(() => {
        this.debugManager.updateDepth(geoState)
        requestRender?.()
      })

    geoFolder.add(geoState, 'renderOrder', 0, 2000, 1)
      .onChange((val) => {
        this.debugManager.updateRenderOrder(val)
        requestRender?.()
      })

    geoFolder.add(geoState, 'showModel')
      .onChange((val) => {
        this.debugManager.setShowModel(val, this.getModel())
        requestRender?.()
      })

    /* ========= Helper ========= */
    const helperFolder = this.gui.addFolder('Helper')
    helperFolder.close()

    const helperState = {
      showGrid: false,
      showAxes: false,
      showBorder: false
    }

    helperFolder.add(helperState, 'showGrid')
      .onChange(v => {
        this.debugManager.setGroundGridHelper(v)
        requestRender?.()
      })

    helperFolder.add(helperState, 'showAxes')
      .onChange(v => {
        this.debugManager.setAxesHelper(v)
        requestRender?.()
      })

    helperFolder.add(helperState, 'showBorder')
      .onChange(v => {
        this.debugManager.setBorderHelper(v, this.getModel())
        requestRender?.()
      })

    this.applyDebugState(geoState, helperState, this.getModel())
    requestRender?.()


    const theme = guiTheme ?? GuiTheme.THEME.WARM
    GuiTheme.apply(this.gui, theme)
    this.isShow = true
  }

  /**
   * 按照状态激活一次相应的控件
   *
   * GUI创建控件和绑定事件，不会激活一次方法，需要手动同步初始化状态
   *
   * @param {object} geoState
   * @param {object} helperState
   * @param {THREE.Object3D} obj
   */
  applyDebugState(geoState, helperState, obj) {
    this.debugManager.setTarget(obj)
    this.debugManager.setDebugMode(geoState.debugMode, obj)
    this.debugManager.updateDepth(geoState)
    this.debugManager.updateRenderOrder(geoState.renderOrder)
    this.debugManager.setShowModel(geoState.showModel, obj)

    this.debugManager.setGroundGridHelper(helperState.showGrid)
    this.debugManager.setAxesHelper(helperState.showAxes)
    this.debugManager.setBorderHelper(helperState.showBorder, obj)
  }

  showGUI() {
    if (!this.gui) return
    this.gui.show()
    this.isShow = true
  }

  hideGUI() {
    if (!this.gui) return
    this.gui.hide()
    this.isShow = false
  }

  toggleGUI() {
    this.isShow ? this.hideGUI() : this.showGUI()
  }

  /**
   * 销毁GUI
   *
   * @returns
   */
  dispose() {
    if (!this.gui) return

    this.gui.destroy()
    this.gui = null

    // 断开引用（防止内存泄漏）
    this.getModel = null
    this.debugManager = null

    this.isShow = false
  }
}
