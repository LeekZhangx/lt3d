/**
 * 场景控制器（UI专用）
 *
 * 职责：
 * - 聚合 UI 操作（不让 UI 直接操作 THREE）
 * - 统一 requestRender 调用
 * - 提供场景状态（state）
 * - 提供计算能力（如 light range）
 */
export class SceneController {

  /**
   * @param {SceneManager} sceneManager 场景管理器
   * @param {() => void} requestRender 请求重新渲染函数
   */
  constructor(sceneManager, requestRender) {
    this.sceneManager = sceneManager
    this.requestRender = requestRender
  }

  // ======================
  // 状态获取
  // ======================

  /**
   * 获取完整场景状态（用于 GUI 初始化）
   */
  getSceneState() {
    return {
      directLight: this.getDirectLightState(),
      ambientLight: this.getAmbientLightState(),
      ground: this.getGroundState()
    }
  }

  /**
   * 获取平行光状态
   */
  getDirectLightState() {
    const light = this.sceneManager.lights.direct
    if (!light) return null

    return {
      intensity: light.intensity,
      x: light.position.x,
      y: light.position.y,
      z: light.position.z
    }
  }

  /**
   * 获取环境光状态
   */
  getAmbientLightState() {
    const light = this.sceneManager.lights.ambient
    if (!light) return null

    return {
      intensity: light.intensity
    }
  }

  /**
   * 获取地面状态
   */
  getGroundState() {
    const ground = this.sceneManager.ground
    if (!ground) return null

    return {
      visible: ground.visible,
      scale: ground.scale.x,
      textureType: 'None'
    }
  }

  // ======================
  // 灯光控制
  // ======================

  /**
   * 设置平行光强度
   * @param {number} intensity 光照强度
   */
  updateDirectLightIntensity(intensity) {
    const light = this.sceneManager.lights.direct
    if (!light) return

    light.intensity = intensity
    this.requestRender()
  }

  /**
   * 设置平行光位置（支持局部更新）
   *
   * @param {Object} params 参数对象
   * @param {number} [params.x] X 坐标（可选）
   * @param {number} [params.y] Y 坐标（可选）
   * @param {number} [params.z] Z 坐标（可选）
   *
   * @example
   * updateDirectLightPosition({ x: 10 }) // 只更新 X
   *
   * updateDirectLightPosition({ x: 10, y: 20, z: 30 }) // 更新全部
   */
  updateDirectLightPosition({x, y, z}) {
    const light = this.sceneManager.lights.direct
    if (!light) return

    if (x !== undefined) light.position.x = x
    if (y !== undefined) light.position.y = y
    if (z !== undefined) light.position.z = z

    this.requestRender()
  }

  /**
   * 设置环境光强度
   * @param {number} intensity 光照强度
   */
  updateAmbientLightIntensity(intensity) {
    this.sceneManager.setAmbientLightIntensity(intensity)
    this.requestRender()
  }

  // ======================
  // 地面控制
  // ======================

  /**
   * 设置地面可见性
   * @param {boolean} visible 是否可见
   */
  updateGroundVisible(visible) {
    this.sceneManager.setGroundVisible(visible)
    this.requestRender()
  }

  /**
   * 设置地面缩放
   * @param {number} scale 缩放值
   */
  updateGroundScale(scale) {
    this.sceneManager.setGroundScale(scale)
    this.requestRender()
  }

  /**
   * 设置地面贴图
   * @param {string} path 纹理路径
   * @param {string|number} [color] 颜色（可选）
   */
  updateGroundTexture(path, color) {
    this.sceneManager.setGroundTexture(path, color)
    this.requestRender()
  }

  // ======================
  // 计算能力
  // ======================

  /**
   * 计算灯光控制范围（用于 GUI 限制）
   *
   * @returns {{
   *  x: [number, number],
   *  y: [number, number],
   *  z: [number, number]
   * } | null}
   */
  getLightRange() {
    const size = this.sceneManager.getSize()
    const center = this.sceneManager.getCenter()

    if (!size || !center) return null

    const range = Math.ceil(Math.max(size.x, size.y, size.z)) * 4

    const x = Math.ceil(center.x)
    const y = Math.ceil(center.y)
    const z = Math.ceil(center.z)

    return {
      x: [x - range, x + range],
      y: [0, y + range],
      z: [z - range, z + range]
    }
  }

  // ======================
  // 初始化同步
  // ======================

  /**
   * 将当前 Scene 状态应用到 GUI（初始化用）
   *
   * - 此方法通常用于“外部已有 state”
   *
   * @param {{
   *  directLightState: { intensity:number, x:number, y:number, z:number },
   *  ambientLightState: { intensity:number },
   *  groundState: { visible:boolean, scale:number, texturePath:string }
   * }} state
   */
  applySceneState(state) {
    if (!state) return

    const { directLightState, ambientLightState, groundState } = state

    if (directLightState) {
      this.updateDirectLightIntensity(directLightState.intensity)
      this.updateDirectLightPosition(
        directLightState.x,
        directLightState.y,
        directLightState.z
      )
    }

    if (ambientLightState) {
      this.updateAmbientLightIntensity(ambientLightState.intensity)
    }

    if (groundState) {
      this.updateGroundVisible(groundState.visible)
      this.updateGroundScale(groundState.scale)

      if (groundState.texturePath) {
        this.updateGroundTexture(groundState.texturePath)
      }
    }
  }

  /**
   * 清理引用，不销毁引用的各个系统
   */
  dispose(){
    this.sceneManager = null
    this.requestRender = null
  }
}