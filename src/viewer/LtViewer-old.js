import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { DebugPanel } from './debug/DebugPanel'
import { LtToMesh } from '../core/tile3d/LtToMesh'
import { DebugMode } from './debug/DebugMode'
import { TextureCache } from '../core/tile3d/texture/TextureCache'
import { StatsPanel } from './stats/StatsPanel'

/**
 * 自定义 THREE.js 展示界面
 */
export class LtViewer {
  constructor(container, options = {}) {
    this.container = container

    //监听贴图加载完毕
    this.loadingManager = new THREE.LoadingManager()

    this.scene = null
    this.camera = null
    this.renderer = null
    this.controls = null

    this.animationId = null
    this.resizeObserver = null

    this._renderRequested = false

    this.options = {
      background: 0xbfd1e5,
      fov: 60,
      near: 0.1,
      far: 1000,
      cameraPos: new THREE.Vector3(0, 1.5, 3),
      target: new THREE.Vector3(0, 1, 0),
      ...options
    }

    // 当前加载的模型根节点
    this.modelRoot = null

    //处理模型和场景各个组件 如 灯光 相机的位置信息
    this._box = new THREE.Box3()
    this._size = new THREE.Vector3()
    this._center = new THREE.Vector3()

    this.lights = {
      ambient: null,
      key: null,
      fill: null,
      back: null
    }

    // 相机初始状态（用于 reset）
    this._initialCameraState = null
    this._initialTarget = null

    this._ground = null

    //debug组件
    this.debugManager = null
    //debug类型
    this._debugMode = DebugMode.NONE

    //stats组件
    this.statsManager = null
  }

  /* ================= 初始化 ================= */

  /**
   * 初始化场景、相机、渲染器等内容
   */
  init() {
    this._initScene()
    this._initCamera()
    this._initRenderer()
    this._initControls()
    this._initLights()
    this._initHelpers()
    this._initGround()

    this.observeResize()

    this._saveInitialCameraState()

    this.debugManager = null
    this.statsManager = null

  }

  _initScene() {
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(this.options.background)
    this.scene.name = 'three_viewer_scene'
  }

  _initCamera() {
    const { clientWidth = 800, clientHeight = 500 } = this.container

    this.camera = new THREE.PerspectiveCamera(
      this.options.fov,
      clientWidth / clientHeight,
      this.options.near,
      this.options.far
    )

    this.camera.position.copy(this.options.cameraPos)
  }

  _initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false
    })

    this.renderer.setSize(
      this.container.clientWidth,
      this.container.clientHeight
    )
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.outputColorSpace = THREE.SRGBColorSpace

    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap

    this.container.appendChild(this.renderer.domElement)
  }

  _initControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = false
    this.controls.target.copy(this.options.target)
    this.controls.update()

    this.controls.addEventListener('change', () => {
      this.requestRenderIfNotRequested()
    })

    this.controls.addEventListener('start', () => {
      this._isInteracting = true
    })

    this.controls.addEventListener('end', () => {
      this._isInteracting = false
    })
  }

  _initLights() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.4)

    const key = new THREE.DirectionalLight(0xffffff, 1.2)
    const fill = new THREE.DirectionalLight(0xffffff, 0.3)
    const back = new THREE.DirectionalLight(0xffffff, 0.2)

    const hemi = new THREE.HemisphereLight( 0xCCEEFF, 0xB97A20, 0.8 );

    key.castShadow = true

    this.scene.add(ambient, key, fill, back)
    this.scene.add(hemi)

    this.lights = { ambient, key, fill, back }

  }

  /**
   * 初始化地面（Ground Plane）
   *
   * 作用：
   * - 提供空间参考（避免模型悬空）
   * - 接收模型投射的阴影
   * - 不干扰模型本身的视觉表现
   *
   * 设计原则：
   * - 只接收阴影，不投射阴影（性能友好）
   * - 使用 PBR 材质，与场景光照统一
   * - 地面默认放置在 y = 0，可根据需要调整
   *
   * @param {Object} options
   * @param {number} options.size 地面边长（默认 50）
   * @param {number} options.y 地面高度（默认 0）
   */
  _initGround(options = {}) {
    const {
      size = 50,
      y = 0
    } = options

    // 如果已存在地面，先移除
    if (this._ground) {
      this.scene.remove(this._ground)
      this._ground.geometry.dispose()
      this._ground.material.dispose()
      this._ground = null
    }

    // 几何
    const geometry = new THREE.PlaneGeometry(size, size)

    // 材质（低存在感）
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0x808080),
      roughness: 0.9,
      metalness: 0.0
    })

    const ground = new THREE.Mesh(geometry, material)

    // 朝上
    ground.rotation.x = -Math.PI / 2
    ground.position.y = y

    // 阴影设置
    ground.receiveShadow = true
    ground.castShadow = false

    ground.name = 'ground'

    this.scene.add(ground)
    this._ground = ground
  }



  _initHelpers() {
    this.scene.add(new THREE.DirectionalLightHelper( this.lights.key, 5, 0xffffff ))
  }

  requestRenderIfNotRequested() {
    if (this._renderRequested) return

    this._renderRequested = true

    requestAnimationFrame(() => {
      this._renderRequested = false
      this.render()
    })
  }

  render() {
    console.log("rende");

    this.controls?.update()
    this.renderer.render(this.scene, this.camera)

    if (this._isInteracting) {
      this.requestRenderIfNotRequested()
    }

    //计算render的渲染次数
    this.statsManager?.recordRender()
  }

  /* ================= 使用接口 ================= */

  /**
   * 一站式加载 lt 蓝图模型（标准入口）
   *
   * 内部流程：
   * 1. 使用 LtToMesh 构建 Three Group
   * 2. 替换当前场景模型
   * 3. 根据模型尺寸自适应相机和控制器
   *
   * @param {*} ltObj - lt 蓝图对象
   * @param {string} name lt对象名称
   */
  loadLtModel(ltObj, name) {
    if (!ltObj) return

    TextureCache.init(this.loadingManager)

    // 1. 构建 Three 模型
    const model = LtToMesh.buildMesh(ltObj, name)


    this.loadingManager.onLoad = () => {
      this.requestRenderIfNotRequested()
    }

    // 2. 设置为当前模型
    this.setModel(model)

    // 3. 自适应视角等
    if (this._analyzeObject(model)) {
      this.fitToObject(model)
      this.fitLightsToObject(model)
      this.fitGroundToModel()
    }

    // let test = new THREE.BoxGeometry(4,5,6)
    // DebugUVs.debugPrintBoxFaces(test)
    // DebugUVs.showUvBox(this.modelRoot)

    this.requestRenderIfNotRequested()
  }



  /**
   * 设置当前模型（不做相机处理）
   * - 清理旧模型
   * - 添加新模型
   */
  setModel(object3D) {
    if (this.modelRoot) {
      this.scene.remove(this.modelRoot)
    }

    this.modelRoot = object3D

    if (object3D) {
      this.scene.add(object3D)
    }

    this.requestRenderIfNotRequested()
  }

  clearModel(){
    if (this.modelRoot) {
      this.scene.remove(this.modelRoot)
    }
    this.requestRenderIfNotRequested()
  }

  clearScene() {
    this._disposeScene(this.scene)
    this.scene.clear()
  }

  /**
   * 根据 Object3D 的包围盒：
   * - 调整 controls target
   * - 调整 camera 位置 / near / far
   */
  fitToObject(object3D, options = {}) {
    if (!this._analyzeObject(object3D)) return

    const maxSize = Math.max(this._size.x, this._size.y, this._size.z)
    const center = this._center

    // ---------- controls ----------
    this.controls.target.copy(center)
    this.controls.update()

    // ---------- camera ----------
    const fov = this.camera.fov * Math.PI / 180
    const distance = maxSize / (2 * Math.tan(fov / 2))

    const offset = options.offset ?? 1.6

    this.camera.position.copy(center)
    this.camera.position.add(
      new THREE.Vector3(distance * offset, distance * offset * 0.8, distance * offset)
    )

    this.camera.near = Math.max(distance / 100, 0.01)
    this.camera.far = distance * 100
    this.camera.updateProjectionMatrix()

    this.requestRenderIfNotRequested()
  }

  /**
   * 自动根据模型调整灯光
   * @param {*} object3D
   * @returns
   */
  fitLightsToObject(object3D) {
    if (!this._analyzeObject(object3D)) return

    const size = this._size
    const center = this._center
    const maxSize = Math.sqrt(Math.pow(size.x, 2) + Math.pow(size.y, 2) + Math.pow(size.z, 2))

    const distance = maxSize

    // 主光（右上前）
    this.lights.key.position.set(
      center.x + distance,
      center.y + distance,
      center.z + distance
    )

    // 补光（左前）
    this.lights.fill.position.set(
      center.x - distance,
      center.y + distance * 0.3,
      center.z + distance
    )

    // 轮廓光（背后）
    this.lights.back.position.set(
      center.x,
      center.y + distance,
      center.z - distance
    )

    // ---------- 阴影自适配 ----------
    const d = maxSize * 1
    const shadowCam = this.lights.key.shadow.camera

    shadowCam.left = -d
    shadowCam.right = d
    shadowCam.top = d
    shadowCam.bottom = -d
    shadowCam.near = 0.1
    shadowCam.far = distance * 3
    shadowCam.updateProjectionMatrix()

    this.lights.key.shadow.map?.dispose()
    this.lights.key.shadow.map = null
    this.lights.key.shadow.mapSize.set(4096, 4096)
    this.lights.key.shadow.needsUpdate = true


  }

  /**
   * 根据当前模型自动调整地面位置与尺寸
   */
  fitGroundToModel() {
    if (!this.modelRoot) return
    if (!this._ground) return
    if (!this._box || this._box.isEmpty()) return

    const size = this._size
    const center = this._center

    const maxXZ = Math.max(size.x, size.z)

    // 调整尺寸
    this._ground.geometry.dispose()
    this._ground.geometry = new THREE.PlaneGeometry(maxXZ * 2, maxXZ * 2)

    // 放到模型底部
    this._ground.position.y = this._box.min.y - 0.001
    this._ground.position.x = center.x
    this._ground.position.z = center.z
  }

    /**
   * 重置相机和控制器到 Viewer 初始化状态
   */
  resetCamera() {
    if (!this._initialCameraState) return

    const s = this._initialCameraState

    this.camera.position.copy(s.position)
    this.camera.near = s.near
    this.camera.far = s.far
    this.camera.fov = s.fov
    this.camera.updateProjectionMatrix()

    this.controls.target.copy(this._initialTarget)
    this.controls.update()

    this.requestRenderIfNotRequested()
  }

  /* ================= resize ================= */

  observeResize() {
    this.resizeObserver = new ResizeObserver(() => {
      if (!this.camera || !this.renderer) return

      const width = this.container.clientWidth
      const height = this.container.clientHeight

      this.camera.aspect = width / height
      this.camera.updateProjectionMatrix()
      this.renderer.setSize(width, height)

      this.requestRenderIfNotRequested()
    })

    this.resizeObserver.observe(this.container)
  }

  /* ================= 销毁 ================= */

  dispose() {
    cancelAnimationFrame(this.animationId)

    this.resizeObserver?.disconnect()
    this.resizeObserver = null

    this.controls?.dispose()
    this.renderer?.dispose()

    this.debugManager?.clearDebugMode()

    this._disposeScene(this.scene)

    if (this.container) {
      this.container.innerHTML = ''
    }

    this.scene = null
    this.camera = null
    this.renderer = null
    this.controls = null
  }

  /**
 * 销毁场景及其物体
 * @param {*} scene
 * @returns
 */
_disposeScene(scene) {
  if (!scene) return

  scene.traverse((obj) => {
    if (obj.geometry) {
      obj.geometry.dispose()
    }

    if (obj.material) {
      if (Array.isArray(obj.material)) {
        obj.material.forEach(m => m.dispose())
      } else {
        obj.material.dispose()
      }
    }
  })
}

  /**
   * 分析并缓存一个 Object3D 的空间信息
   *
   * 作用：
   * - 计算并缓存模型的包围盒（Box3）
   * - 提取模型的整体尺寸（_size）
   * - 提取模型的几何中心点（_center）
   *
   * 使用场景：
   * - 相机自动对焦 / fitToObject
   * - 灯光自动适配 / fitLightsToObject
   * - 阴影、辅助线、后处理的尺寸基准
   *
   * 设计说明：
   * - 这是 Viewer 内部的“统一空间分析入口”
   * - 相机、灯光等模块不直接 setFromObject，避免重复计算
   * - 若 object3D 没有有效几何体（空 Group），返回 false
   *
   * @param {THREE.Object3D} object3D 需要分析的模型或模型根节点
   * @returns {boolean} 是否成功获取有效的包围盒信息
   */
  _analyzeObject(object3D) {
    this._box.setFromObject(object3D)

    if (this._box.isEmpty()) return false

    this._box.getSize(this._size)
    this._box.getCenter(this._center)

    return true
  }

  /**
   * 记录当前相机与控制器的初始状态
   *
   * 作用：
   * - 保存相机的初始参数，用于后续恢复视角
   * - 常用于 resetCamera / resetView 等功能
   *
   * 保存内容：
   * - 相机位置（position）
   * - 相机裁剪面（near / far）
   * - 视角（fov）
   * - OrbitControls 的目标点（target）
   *
   * 设计说明：
   * - 该方法通常只在 Viewer 初始化完成后调用一次
   * - 后续的 fitToObject / fitLightsToObject 会修改相机状态
   * - resetCamera 可以基于该快照完整还原初始视角
   *
   * 注意：
   * - 使用 clone() 避免引用被后续操作污染
   * - target 单独保存，避免和 camera 状态耦合
   */
  _saveInitialCameraState() {
    this._initialCameraState = {
      position: this.camera.position.clone(),
      near: this.camera.near,
      far: this.camera.far,
      fov: this.camera.fov
    }
    this._initialTarget = this.controls.target.clone()
  }

  /* ================= debug部分 ================= */

  openDebugGui(containerDiv){
    if(!this.debugManager){
      this.debugManager = new DebugPanel(this.scene, this.renderer)
    }
    this.debugManager.enableGUI(() => this.modelRoot, containerDiv ?? this.container, () => this.requestRenderIfNotRequested())
  }

  closeDebugGui(){
    this.debugManager.disableGUI()
  }

  /* ================= stats部分 ================= */

  openStatsGui(containerDiv){
    if(!this.statsManager){
      this.statsManager = new StatsPanel(this.scene, this.renderer)
    }
    this.statsManager.enableGUI(null, containerDiv ?? this.container, null)
  }

  closeStatsGui(){
    this.statsManager.disableGUI()
  }
}
