import { GUI } from 'lil-gui'
import { DebugMode } from './DebugMode.js'
import { GuiTheme } from '../gui/GuiTheme.js'
import { DebugController } from './DebugController.js'

/**
 * 几何体 Debug GUI 控制面板
 */
export class DebugPanel {

  /**
   * 实例化 几何体 Debug GUI 控制面板
   * @param {DebugController} debugController
   */
  constructor(debugController) {
    this.controller = debugController
    this.gui = null

    /**
     * 当前GUI是否显示
     */
    this.isShow = false
  }

  /**
   * 启用 GUI
   *
   * @param {HTMLDivElement} container GUI 挂载的 DOM 容器
   * @param {keyof GuiTheme.THEME} guiTheme gui主题， 获取自 GuiTheme.THEME
   * @returns {void}
   */
  enableGUI(container, guiTheme) {
    if (this.gui) {
      this.showGUI()
      return
    }

    this.gui = new GUI({
      title: 'Debug',
      container
    })

    const geoState = this.controller.getGeoState()

    /* ========= Geometry ========= */
    const geoFolder = this.gui.addFolder('Geometry')
    geoFolder.close()

    geoFolder.add(geoState, 'debugMode', Object.values(DebugMode))
      .onChange((val) => {
        this.controller.setDebugMode(val)
      })

    geoFolder.add(geoState, 'depthTest')
      .onChange(() => {
        this.controller.updateDepth(geoState)
      })

    geoFolder.add(geoState, 'depthWrite')
      .onChange(() => {
        this.controller.updateDepth(geoState)
      })

    geoFolder.add(geoState, 'renderOrder', 0, 2000, 1)
      .onChange((val) => {
        this.controller.updateRenderOrder(val)
      })

    geoFolder.add(geoState, 'showModel')
      .onChange((val) => {
        this.controller.setShowModel(val)
      })

    /* ========= Helper ========= */
    const helperFolder = this.gui.addFolder('Helper')
    helperFolder.close()

    const helperState = this.controller.getHelperState()

    helperFolder.add(helperState, 'showGroundGrid')
      .onChange(v => {
        this.controller.setGroundGridHelper(v)
      })

    helperFolder.add(helperState, 'showAxes')
      .onChange(v => {
        this.controller.setAxesHelper(v)
      })

    helperFolder.add(helperState, 'showBorder')
      .onChange(v => {
        this.controller.setBorderHelper(v)
      })

    helperFolder.add(helperState, 'showOrigin')
      .onChange(v => {
        this.controller.setOriginHelper(v)
      })

    this.controller.applyDebugState(geoState, helperState)


    const theme = guiTheme ?? GuiTheme.THEME.WARM
    GuiTheme.apply(this.gui, theme)
    this.isShow = true
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

    this.controller = null

    this.isShow = false
  }
}
