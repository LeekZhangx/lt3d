import * as THREE from 'three'
import { RenderSystem } from './core/RenderSystem.js'
import { SceneManager } from './scene/SceneManager.js'
import { ModelManager } from './model/ModelManager.js'
import { DebugManager } from './debug/DebugManager.js'
import { DebugPanel } from './debug/DebugPanel.js'
import { ControlsSystem } from './core/ControlsSystem.js'
import { ScenePanel } from './scene/ScenePanel.js'
import { StatsPanel } from './stats/StatsPanel.js'
import { TextureCache } from '../core/tile3d/texture/TextureCache.js'
import { LtMeshBuilder } from '../core/tile3d/LtMeshBuilder.js'
import { LT_VERSION } from '../core/version/LtVersion.js'
import { ResourceSystem } from '../core/tile3d/resource/ResourceSystem.js'
import { CameraSystem } from './core/CameraSystem.js'
import { UIManager } from './UIManager.js'

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
    this.cameraSystem = null
    this.controlsSystem = null
    this.pickingSystem = null

    this.uiManager = null

    this.sceneManager = null

    this.modelManager = null
    this.modelProvider = null

    this.debugManager = null

    //===== 资源系统 =====
    this.loadingManager = null

    this.resourceSystem = null

    this.ltMeshBuilder = null

    this._renderRequested = false
    this._resizeObserver = null
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
    this.uiManager.openScenePanel({
      container: container || this.container,
      sceneManager: this.sceneManager,
      requestRender: () => this.requestRender()
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

  get isCameraPanellVisible() {
    return this.uiManager.cameraPanel.isShow
  }

  openCameraPanel(container) {
    this.uiManager.openCameraPanel({
      container,

      // 当前类型（给 UI 初始值）
      getType: () => {
        return this.cameraSystem.getCamera().isPerspectiveCamera
          ? 'perspective'
          : 'orthographic'
      },

      // 切换相机
      // 需要 相机 和 控制器一起配合行动 只能进行回调
      // 相机更换后 Renderer和Controls都需要更新相机
      onSwitch: (type) => {
        console.log(type);
        
        // 同步状态（防止跳）
        this.cameraSystem.syncCameras()

        // 切换相机
        if (type === 'perspective') {
          this.cameraSystem.setPerspective()
        } else {
          this.cameraSystem.setOrthographic()
        }

        // 通知 controls
        this.controlsSystem.setCamera(
          this.cameraSystem.getCamera()
        )

        this.renderSystem.setCamera(
          this.cameraSystem.getCamera()
        )

        this.requestRender()

      }
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
    this.uiManager.openStatsPanel({
      container: container || this.container,
      scene: this.sceneManager.scene,
      renderer: this.renderSystem.renderer
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
    }

    this.uiManager.openDebugPanel({
      container: container || this.container,
      debugManager: this.debugManager,
      getModel: () => this.modelManager.getModel(),
      requestRender: () => this.requestRender()
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

    this.debugManager?.dispose()
    this.debugManager = null


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
