import * as THREE from 'three'
import { RenderSystem } from './core/RenderSystem'
import { SceneManager } from './scene/SceneManager'
import { ModelManager } from './model/ModelManager'
import { DebugManager } from './debug/DebugManager'
import { DebugPanel } from './debug/DebugPanel'
import { ControlsSystem } from './core/ControlsSystem'
import { ScenePanel } from './scene/ScenePanel'
import { StatsPanel } from './stats/StatsPanel'
import { TextureCache } from '../core/tile3d/texture/TextureCache'
import { LtToMesh } from '../core/tile3d/LtToMesh'

export class LtViewer {

  /**
   *  实例化 LtViewer
   *
   * @param {HTMLElement} container 注入的 DOM元素 目标
   * @param {Object} options
   */
  constructor(container, options = {}) {
    this.container = container

    this.options = options

    this.renderSystem = null
    this.ControlsSystem = null
    this.pickingSystem = null

    this.sceneManager = null
    this.scenePanel = null

    this.modelManager = null

    this.statsPanel = null

    this.debugManager = null
    this.debugPanel = null

    this.loadingManager = new THREE.LoadingManager()

    this._renderRequested = false
    this._resizeObserver = null
  }

  init() {
    // 1 渲染系统
    this.renderSystem = new RenderSystem(this.container, this.options)

    // 2 Scene
    this.sceneManager = new SceneManager(this.renderSystem.scene)
    this.sceneManager.init()

    // 3 控制器

    //摄像机轨道控制
    this.controls = new ControlsSystem({
      camera : this.renderSystem.camera,
      domElement : this.renderSystem.renderer.domElement
    }
    )

    this.controls.onChange(() => this.requestRender())

    //交互控制
    // this.pickingSystem = new PickingSystem(
    //   this.renderSystem.camera,
    //   this.renderSystem.renderer,
    //   this.renderSystem.renderer.domElement
    // )

    // 4 Model
    this.modelManager = new ModelManager(this.renderSystem.scene)
    this.sceneManager.setModelManager(this.modelManager)

    this._observeResize()
  }

  /* ================= 加载模型 ================= */

  /**
   * 从 ltObj 加载 lt3d对象
   *
   * @param {Object} ltObj
   * @param {string} name
   * @returns
   */
  loadModelFromLtObj(ltObj, name){
    if (!ltObj) return

    TextureCache.init(this.loadingManager)

    this.loadingManager.onLoad = () => {
      this.requestRender()
    }

    // 从 ltObj 构建 Three 模型
    const ltModel3d = LtToMesh.buildMesh(ltObj, name)

    this._loadModel(ltModel3d)
  }

  /**
   * 加载3D模型
   *
   * @param {THREE.Object3D} object3D 已经实现的 Three 3D 对象
   */
  _loadModel(object3D) {
    this.modelManager.setModel(object3D)

    if (this.modelManager.analyze()) {
      this.renderSystem.fitCamera(this.modelManager)
      this.sceneManager.fitLights()
      this.sceneManager.fitGround()

      this.scenePanel?.updateGUI()
    }

    this.requestRender()
  }

  /* ================= 渲染 ================= */

  requestRender() {
    if (this._renderRequested) return

    this._renderRequested = true

    requestAnimationFrame(() => {
      this._renderRequested = false
      this.render()
    })
  }

  render() {
    console.log('render...');

    this.renderSystem.render()
    this.ControlsSystem?.update()
    this.pickingSystem?.update()

    //计算render的渲染次数
    this.statsPanel?.recordRender()
  }

  /* ================= GUI ================= */

  // ===== Scene Panel =====

  get isScenePanelVisible() {
    return this.scenePanel?.isShow || false
  }

  openScenePanel(container){
    if (!this.scenePanel) {
      this.scenePanel = new ScenePanel(this.sceneManager)
      this.scenePanel.enableGUI(container || this.container, () => this.requestRender())
    } else {
      this.scenePanel.showGUI()
    }
  }

  hideScenePanel(){
    if (this.scenePanel) {
      this.scenePanel.hideGUI()
    }
  }

  toggleScenePanel(container) {
    if (!this.scenePanel || !this.scenePanel.isShow) {
      this.openScenePanel(container)
    }else{
      this.hideScenePanel()
    }
  }


  // ===== Stats Panel =====

  get isStatsPanelVisible() {
    return this.statsPanel?.isShow || false
  }

  openStatsPanel(container){
    if (!this.statsPanel) {
      this.statsPanel = new StatsPanel(this.sceneManager.scene, this.renderSystem.renderer)
      this.statsPanel.enableGUI(container || this.container)
    }else{
      this.statsPanel.showGUI()
    }
  }

  hideStatsPanel(){
    if (this.statsPanel) {
      this.statsPanel.hideGUI()
    }
  }

  toggleStatsPanel(container) {
    if (!this.statsPanel || !this.statsPanel.isShow) {
      this.openStatsPanel(container)
    }else{
      this.hideStatsPanel()
    }
  }


  // ===== Debug Panel =====

  get isDebugPanelVisible() {
    return this.debugPanel?.isShow || false
  }

  openDebugPanel(container) {
    if(!this.debugManager){
      this.debugManager = new DebugManager(this.renderSystem.scene)
    }

    if (!this.debugPanel) {
      this.debugPanel = new DebugPanel(this.debugManager)

      this.debugPanel.enableGUI(
        () => this.modelManager.getModel(),
        container ?? this.container,
        () => this.requestRender()
      )
    } else {
      this.debugPanel.showGUI()
    }
  }

  hideDebugPanel(){
    if (this.debugPanel) {
      this.debugPanel.hideGUI()
    }
  }

  toggleDebugPanel(container) {
    if (!this.debugPanel || !this.debugPanel.isShow) {
      this.openDebugPanel(container)
    }else{
      this.hideDebugPanel()
    }
  }

  // ===== GUI dispose =====

  disposeAllGUI(){
    this.scenePanel?.dispose()
    this.scenePanel = null

    this.statsPanel?.dispose()
    this.statsPanel = null

    this.debugPanel?.dispose()
    this.debugPanel = null
  }

  /* ================= 卸载 ================= */

  /**
   * 销毁整个 Viewer（释放所有资源）
   */
  dispose() {

    // ==== GUI ====

    this.disposeAllGUI()

    this.debugManager?.dispose()
    this.debugManager = null


    // ==== 交互系统 ====

    this.controls?.dispose()
    this.controls = null

    this.pickingSystem?.dispose()
    this.pickingSystem = null


    // ==== 模型 ====

    this.modelManager?.dispose()
    this.modelManager = null


    // ==== 场景 ====

    this.sceneManager?.dispose()
    this.sceneManager = null


    // ==== 渲染系统 ====

    this.renderSystem?.dispose()
    this.renderSystem = null


    // ==== 其他 ====

    TextureCache.dispose()

    this.loadingManager = null
    this._renderRequested = false

    // ==== observeResize ====
    if (this._resizeObserver) {
      this._resizeObserver.disconnect()
      this._resizeObserver = null
    }
  }

  /* ================= resize ================= */

  /**
   * 监听 DOM 容器大小变化,变化调用 resize()
   */
  _observeResize() {
    let resizePending = false

    this._resizeObserver = new ResizeObserver(() => {
      if (resizePending) return

      resizePending = true

      requestAnimationFrame(() => {
        resizePending = false
        this.renderSystem.resize()
        this.requestRender()
      })
    })

    this._resizeObserver.observe(this.container)
  }
}
