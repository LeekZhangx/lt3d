import * as THREE from 'three'
import { GUI } from 'lil-gui'
import { StatsManager } from './StatsManager.js'
import { GuiTheme } from '../util/GuiTheme.js'


/**
 * 性能统计 GUI 控制面板
 */
export class StatsPanel {

  /**
   * 实例化 性能统计 GUI 控制面板
   *
   * @param {THREE.scene} scene 场景
   * @param {THREE.Renderer} renderer 渲染器
   *
   */
  constructor(scene, renderer) {
    this.scene = scene
    this.renderer = renderer
    this.gui = null

    /**
     * 当前GUI是否显示
     */
    this.isShow = false

    /* ===== 统计数据部分 ===== */
    this.statsManager = new StatsManager(this.renderer)

    this.stats = this.statsManager.stats

  }

  /* ================================
     公共接口
  ================================= */

  // ===== GUI区域  =====

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
      this.statsManager.start()
      return
    }

    this.gui = new GUI({
      title: 'Stats',
      container: container
    })


    /*
    * ========== 性能展示数据 ==========
    */
    const perfFolder = this.gui.addFolder('Performance')
    perfFolder.close()

    perfFolder.add(this.stats, 'browserFps').name('Browser FPS').listen()
    perfFolder.add(this.stats, 'renderFps').name('Render FPS').listen()
    perfFolder.add(this.stats, 'calls').name('Draw Calls').listen()


    const geoFolder = this.gui.addFolder('Geometry stats')
    geoFolder.close()

    geoFolder.add(this.stats, 'triangles').name('Triangles').listen()
    geoFolder.add(this.stats, 'lines').name('Lines').listen()
    geoFolder.add(this.stats, 'points').name('Points').listen()


    this.statsManager.start()


    const theme = guiTheme ?? GuiTheme.THEME.PURPLE
    GuiTheme.apply(this.gui, theme)
    this.isShow = true
  }

  /**
   * 销毁GUI
   *
   * 停止数据统计并断开引用
   */
  dispose() {
    // 1. GUI
    if (this.gui) {
      this.gui.destroy()
      this.gui = null
    }

    // 停止统计循环
    if (this.statsManager) {
      this.statsManager.stop()
    }

    // 断开引用
    this.statsManager = null
    this.stats = null
    this.getModel = null

    this.renderer = null
    this.scene = null

    this.isShow = false
  }

  /**
   * 显示GUI
   */
  showGUI() {
    if (!this.gui) return
    this.gui.show()

    this.isShow = true
  }

  /**
   * 隐藏GUI
   */
  hideGUI() {
    if (!this.gui) return
    this.gui.hide()

    this.isShow = false
  }

  /**
   * 切换GUI 隐藏/显示
   * @returns
   */
  toggleGUI() {
    this.isShow ? this.hideGUI() : this.showGUI()
  }


  /* ================================
     Stats
  ================================= */

  /**
   * 记录Render帧率
   */
  recordRender() {
    this.statsManager.recordRender()
  }


}
