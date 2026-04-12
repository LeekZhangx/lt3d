import { TextureCache } from '../../core/tile3d/texture/TextureCache'
import { ModelManager } from '../model/ModelManager'
import * as THREE from 'three'

/**
 * 场景管理器
 *
 * 用于管理场景的灯光地面这类基础元素
 */
export class SceneManager {
  constructor(scene) {
    this.scene = scene
    this.lights = {}
    this.ground = null

    /**
     * @type {ModelManager}
     */
    this.modelManager = null

  }

  init() {
    this._initLights()
    this._initGround()
  }

  /**
   * 设置模型管理器，用于获取模型的包围盒
   *
   * @param {ModelManager} modelManager
   */
  setModelManager(modelManager){
    this.modelManager = modelManager
  }

  /**
   * 获取模型的包围盒
   *
   * @returns {THREE.Box3}
   */
  getBox(){
    return this.modelManager.box.clone()
  }

  /**
   * 获取模型包围盒尺寸
   *
   * @returns {THREE.Vector3}
   */
  getSize(){
    return this.modelManager.size.clone()
  }

  /**
   * 获取模型包围盒中心位置
   *
   * @returns {THREE.Vector3}
   */
  getCenter(){
    return this.modelManager.center.clone()
  }

  _initLights() {
    const ambient = new THREE.AmbientLight(0xffffff, 1)
    const direct = new THREE.DirectionalLight(0xffffff, 1.2)

    direct.castShadow = true

    this.scene.add(ambient, direct)

    this.lights = { ambient, direct }
  }

  /**
   * 适配灯光
   */
  fitLights() {

    const size = this.getSize()
    const center = this.getCenter()

    const maxDim = Math.ceil(Math.max(size.x, size.y, size.z))

    const light = this.lights.direct

    // 光源位置
    light.position.set(
      Math.ceil(center.x) + maxDim,
      Math.ceil(center.y) + maxDim,
      Math.ceil(center.z) + maxDim
    )

    light.target.position.copy(center)
    light.target.updateMatrixWorld()

    // 阴影相机范围
    const d = maxDim * 1.5

    light.shadow.camera.left = -d
    light.shadow.camera.right = d
    light.shadow.camera.top = d
    light.shadow.camera.bottom = -d

    light.shadow.camera.near = 0.1
    light.shadow.camera.far = d * 4

    light.shadow.camera.updateProjectionMatrix()

    // 阴影贴图分辨率
    light.shadow.mapSize.set(1024, 1024)

  }

  _initGround(texturePath) {
    const geo = new THREE.PlaneGeometry(1, 1) // 初始化时随便一个大小

    let mat
    if (texturePath) {
      const texture = TextureCache.load(texturePath)
      texture.needsUpdate = true

      mat = new THREE.MeshStandardMaterial({ map: texture })
    } else {
      mat = new THREE.MeshStandardMaterial({ color: 0x808080 })
    }

    const g = new THREE.Mesh(geo, mat)
    g.rotation.x = -Math.PI / 2
    g.receiveShadow = true

    this.scene.add(g)
    this.ground = g
  }

  /**
   * 设置地面尺寸缩放
   *
   * @param {number} scale 缩放值（自动向上取整）
   */
  setGroundScale(scale) {
    if (!this.ground) return

    const s = Math.ceil(scale)

    // 更新 geometry scale
    this.ground.scale.set(s, s)


    // 更新贴图 repeat（保持密度一致）
    const map = this.ground.material.map
    if (map) {
      map.repeat.set(s, s)
      // map.offset.set(-s / 2, -s / 2)
    }

    this.ground.material.needsUpdate = true
  }

  /**
   * 替换地面贴图
   *
   * @param {string} texturePath
   * @param {string} color 叠加色 Color.set支持的样式，例如 #FFFFFF 0xAAFAA4
   */
  setGroundTexture(texturePath, color) {
    if (!this.ground) return

    // 卸载旧贴图
    if (this.ground.material.map) {
      this.ground.material.map?.dispose()
    }

    const repeat = this.ground.scale.x

    if(!color){
      color = 0xffffff
    }

    // 加载新贴图
    const texture = TextureCache.get(texturePath, 'ground')
    this.ground.material.map = texture
    this.ground.material.color.set(color)
    this.ground.material.map.repeat.set(repeat, repeat)
    this.ground.material.map.offset.set(-repeat / 2, -repeat / 2)//放置缩放跳动
    this.ground.material.needsUpdate = true
  }

  /**
   * 适配地面
   */
  fitGround() {

    const size = this.getSize()
    const center = this.getCenter()

    const x = Math.ceil(center.x)
    const z = Math.ceil(center.z)

    this.ground.position.set(x, 0, z)

    const max = Math.ceil(Math.max(size.x, size.z))

    this.setGroundScale(max)
  }

  /**
   * 设置方向光强度
   *
   * @param {number} v
   */
  setDirectLightIntensity(v) {
    if (!this.lights.direct){
      this.lights.direct.intensity = v
    }
  }

  /**
   * 设置环境光强度
   *
   * @param {number} v
   */
  setAmbientLightIntensity(v){
    if (this.lights.ambient) {
      this.lights.ambient.intensity = v
    }
  }

  /**
   * 设置地面可见
   *
   * @param {boolean} visible
   */
  setGroundVisible(visible) {
    if (this.ground) {
      this.ground.visible = visible
    }
  }

  /**
   * 清空场景基础元素（用于重新 init）
   * 不销毁本身
   */
  clear() {

    // 移除灯光
    if (this.lights) {
      Object.values(this.lights).forEach(light => {
        this.scene.remove(light)
      })
    }

    this.lights = {}

    // 移除地面（并释放资源）
    if (this.ground) {
      this.scene.remove(this.ground)

      this.ground.geometry?.dispose()
      this.ground.material?.dispose()

      this.ground = null
    }
  }

  /**
   * 销毁 SceneManager
   */
  dispose() {

    // 1. 清空内容
    this.clear()

    // 2. 清理引用
    this.scene = null
    this.lights = null
    this.ground = null

  }

}
