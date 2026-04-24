import * as THREE from 'three'
import { RenderSystem } from './core/RenderSystem.js'
import { SceneManager } from './scene/SceneManager.js'
import { ModelManager } from './model/ModelManager.js'
import { DebugManager } from './debug/DebugManager.js'
import { ControlsSystem } from './core/ControlsSystem.js'
import { LtMeshBuilder } from '../core/tile3d/LtMeshBuilder.js'
import { LT_VERSION } from '../core/version/LtVersion.js'
import { ResourceSystem } from '../core/tile3d/resource/ResourceSystem.js'
import { CameraSystem } from './core/CameraSystem.js'
import { UIManager } from './gui/UIManager.js'
import { SceneController } from './scene/SceneController.js'
import { StatsManager } from './stats/StatsManager.js'
import { DebugController } from './debug/DebugController.js'
import { CameraController } from './camera/CameraController.js'

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

    //===== 核心系统 ====

    this.renderSystem = null
    this.cameraSystem = null
    this.controlsSystem = null
    this.pickingSystem = null

    this._renderRequested = false
    this._resizeObserver = null

    this.sceneManager = null

    this.modelManager = null
    /**
     * 模型的空间信息函数，包含 getBox getSize getCenter
     */
    this.modelProvider = null

    //===== 资源系统 =====

    this.loadingManager = null

    this.resourceSystem = null

    this.ltMeshBuilder = null

    //==== GUI 部分 ====
    //下属对象都是其各自模块GUI依赖的对象

    this.uiManager = null

    this.cameraController = null

    this.sceneController = null

    this.statsManager = null

    this.debugManager = null
    this.debugController = null

  }

  init() {
    this.uiManager = new UIManager()

    //资源初始化
    this.loadingManager = new THREE.LoadingManager()
    this.resourceSystem = new ResourceSystem(this.loadingManager)

    this.ltMeshBuilder = new LtMeshBuilder(this.resourceSystem)

    //0 相机系统
    this.cameraSystem = new CameraSystem(this.container)

    // 1 渲染系统
    this.renderSystem = new RenderSystem(this.container, this.options)
    this.renderSystem.setCamera(this.cameraSystem.getCamera())

    // 2 Scene
    this.sceneManager = new SceneManager(
      this.renderSystem.scene, 
      this.resourceSystem.textureCache
    )
    this.sceneManager.init()

    // 3 控制器

    //摄像机轨道控制
    this.controlsSystem = new ControlsSystem({
      camera : this.cameraSystem.getCamera(),
      domElement : this.renderSystem.renderer.domElement
    }
    )

    this.controlsSystem.onChange(() => this.requestRender())

    //交互控制
    // this.pickingSystem = new PickingSystem(
    //   this.renderSystem.camera,
    //   this.renderSystem.renderer,
    //   this.renderSystem.renderer.domElement
    // )

    // 4 Model
    this.modelManager = new ModelManager(this.renderSystem.scene)

    //模型的空间信息函数
    this.modelProvider = {
      getBox: () => this.modelManager.getBox(),
      getSize: () => this.modelManager.getSize(),
      getCenter: () => this.modelManager.getCenter()
    }

    this.sceneManager.setModelProvider(this.modelProvider)

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

    this.loadingManager.onLoad = () => {
      this.requestRender()
    }

    const ctx = this.resourceSystem.createBuildContext({
      ltVersion: ltObj.ltVersion
    })

    // 从 ltObj 构建 Three 模型
    const ltModel3d = this.ltMeshBuilder.build(ltObj, name, ctx)

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
      const bounds = this.modelManager.getBounds()

      this.cameraSystem.fit(bounds)

      this.controlsSystem.fitCenter(bounds.center)

      this.sceneManager.updateSceneItems()

      this.uiManager.updateGUI()

      this.debugManager?.updateDebugItems()

    }

    this.requestRender()

  }

  /* ================= 贴图管理 ================= */

  /**
   * 添加额外的方块贴图匹配表
   * 
   * @param {keyof typeof LT_VERSION} version 
   * @param {object} table 方块名称和纹理贴图映射表
   */
  registerTextureTable(version, table) {
    this.resourceSystem.registerTextureTable(table, version)
    const resolver = this._getResolver(version)
    resolver.registerTable(table)
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
    this.controlsSystem.update()
    this.pickingSystem?.update()

    //计算render的渲染次数
    this.statsPanel?.recordRender()
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

        const w = this.container.clientWidth
        const h = this.container.clientHeight

        this.cameraSystem.resize(w, h)

        this.requestRender()
      })
    })

    this._resizeObserver.observe(this.container)
  }

  /* ================= GUI ================= */

  /* ================= Scene Panel ================= */

  get isScenePanelVisible() {
    return this.uiManager.scenePanel.isShow
  }

  openScenePanel(container) {

    if(!this.sceneController){
      this.sceneController = new SceneController(
        this.sceneManager, 
        () => this.requestRender()
      )
    }

    this.uiManager.openScenePanel({
      container: container || this.container,
      sceneController: this.sceneController,
    })
  }

  hideScenePanel() {
    this.uiManager.hideScenePanel()
  }

  toggleScenePanel(container) {
    if (!this.uiManager.scenePanel || !this.uiManager.scenePanel.isShow) {
      this.openScenePanel(container)
    }else{
      this.hideScenePanel()
    }
  }

  /* ================= Camera Panel ================= */

  get isCameraPanelVisible() {
    return this.uiManager.cameraPanel.isShow
  }

  openCameraPanel(container) {

    this.cameraController = new CameraController({
      cameraSystem: this.cameraSystem,
      controlsSystem: this.controlsSystem,
      renderSystem: this.renderSystem,
      requestRender: () => this.requestRender()
    })

    this.uiManager.openCameraPanel({
      container: container || this.container,
      cameraController: this.cameraController
    })

  }

  hideCameraPanel() {
    this.uiManager.hideCameraPanel()
  }

  toggleCameraPanel(container) {
    if (!this.uiManager.cameraPanel || !this.uiManager.cameraPanel.isShow) {
      this.openCameraPanel(container)
    }else{
      this.hideCameraPanel()
    }
  }

  /* ================= Stats Panel ================= */

  get isStatsPanelVisible() {
    return this.uiManager.statsPanel.isShow
  }

  openStatsPanel(container) {
    this.statsManager = new StatsManager(this.renderSystem.renderer)

    this.uiManager.openStatsPanel({
      container: container || this.container,
      statsManager: this.statsManager
    })
  }

  hideStatsPanel() {
    this.uiManager.hideStatsPanel()
  }

  toggleStatsPanel(container) {
    if (!this.uiManager.statsPanel || !this.uiManager.statsPanel.isShow) {
      this.openStatsPanel(container)
    }else{
      this.hideStatsPanel()
    }
  }


  /* ================= Debug Panel ================= */

  get isDebugPanelVisible() {
    return this.uiManager.debugPanel.isShow
  }

  openDebugPanel(container) {

    if (!this.debugManager) {
      this.debugManager = new DebugManager(
        this.renderSystem.scene,
        () => this.modelManager.getModel()
      )
      this.debugManager.setModelProvider(this.modelProvider)

      this.debugController = new DebugController(
        this.debugManager,
        () => this.requestRender()
      )
    }

    this.uiManager.openDebugPanel({
      container: container || this.container,
      debugController: this.debugController,
    })
  }

  hideDebugPanel() {
    this.uiManager.hideDebugPanel()
  }

  toggleDebugPanel(container) {
    if (!this.uiManager.debugPanel || !this.uiManager.debugPanel.isShow) {
      this.openDebugPanel(container)
    }else{
      this.hideDebugPanel()
    }
  }


  /* ================= 卸载 ================= */

  /**
   * 销毁整个 Viewer（释放所有资源）
   */
  dispose() {

    // ==== GUI ====

    this.uiManager.dispose()

    this.sceneController?.dispose()
    this.sceneController = null

    this.cameraController?.dispose()
    this.cameraController = null

    this.debugController?.dispose()
    this.debugController = null
    this.debugManager?.dispose()
    this.debugManager = null

    this.statsManager?.dispose()
    this.statsManager = null


    // ==== 交互系统 ====

    this.controlsSystem.dispose()
    this.controlsSystem = null

    this.pickingSystem?.dispose()
    this.pickingSystem = null

    this.cameraSystem.dispose()
    this.cameraSystem = null


    // ==== 模型 ====

    this.modelManager.dispose()
    this.modelProvider = null
    this.modelManager = null

    this.resourceSystem.dispose()
    this.resourceSystem = null
    this.ltMeshBuilder = null


    // ==== 场景 ====

    this.sceneManager.dispose()
    this.sceneManager = null


    // ==== 渲染系统 ====

    this.renderSystem.dispose()
    this.renderSystem = null


    // ==== 其他 ====

    this.loadingManager = null
    this._renderRequested = false

    // ==== observeResize ====
    if (this._resizeObserver) {
      this._resizeObserver.disconnect()
      this._resizeObserver = null
    }
  }

  
}
