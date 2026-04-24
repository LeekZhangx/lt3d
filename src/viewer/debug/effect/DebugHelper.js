import { RectGridHelper } from '../../helper/RectGridHelper.js'
import * as THREE from 'three'
/**
 * 辅助器
 */
export class DebugHelper {

  /**
   * Helper辅助器
   * @param {THREE.Scene} scene
   */
  constructor(scene) {
    this.scene = scene

    this.root = new THREE.Group()
    this.root.name = "DebugHelperRoot"
    this.scene.add(this.root)

    //layer是THREE.Group对象
    this.groundGridLayer = null
    this.axesLayer = null
    this.borderLayer = null
    this.originLayer = null
  }

  /**
   * 清除该层内所有元素
   * 
   * @param {*} layer 
   */
  _disposeLayer(layer) {
    layer.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose()
      if (obj.material) obj.material.dispose()
    })
  }

  /**
   * @typedef {Object} groundGridParams 地面网格参数
   * @property {THREE.Vector3} [size]
   * @property {THREE.Vector3} [position]
   */

  /**
   * 启用地面网格
   * @param {boolean} visible
   * @param {groundGridParams} params
   */
  enableGroundGridHelper(visible, params){

    if (!this.groundGridLayer) {

      this.groundGridLayer = this._createGroundGridHelper(params)
      this.root.add(this.groundGridLayer)
    }

    this.groundGridLayer.visible = visible

  }

  /**
   * 更新地面网格
   * 
   * 最好在visible == true的才能执行该方法
   * 
   * @param {groundGridParams} params 
   */
  updateGroundGrid(params) {
    if (this.groundGridLayer) {
      this.root.remove(this.groundGridLayer)
      this._disposeLayer(this.groundGridLayer)
      this.groundGridLayer = null
    }

    this.enableGroundGridHelper(true, params)
  }


  _createGroundGridHelper(options) {

    const size = options?.size ?? {x:10, y:10, z:10}
    // const divisions = options?.divisions ?? {x:10, y:10, z:10}
    // const position = options?.size ? new THREE.Vector3(options.size.x, 0, options.size.z) :  new THREE.Vector3(0, 0, 0)

    const layer = new THREE.Group()
    layer.name = 'DebugHelper_GroundGrid'

    let x = Math.ceil(size.x) + 2
    let z = Math.ceil(size.z) + 2

    const helper = new RectGridHelper(
      x, z,
      x, z)
    helper.position.set((x / 2) - 1, 0 , (z / 2) - 1)
    layer.add(helper)

    return layer
  }

  /**
   * 启用坐标轴提示
   * 
   * @param {boolean} visible
   * @param {object} param
   * @param {number} param.size AxesHelper的尺寸
   */
  enableAxesHelper(visible, param){

    if (!this.axesLayer) {

      this.axesLayer = this._createAxesHelper(param)

      const size = param?.size ?? 20

      this.axesLayer.scale.setScalar(size)

      this.root.add(this.axesLayer)
    }

    this.axesLayer.visible = visible

  }

  /**
   * 更新坐标轴提示
   * 
   * 最好在visible == true的才能执行该方法
   * 
   * @param {*} params 
   */
  updateAxesHelper(params) {
    if (!this.axesLayer) return

    const size = params?.size ?? 20

    // 直接缩放 layer
    this.axesLayer.scale.setScalar(size)
  }

  _createAxesHelper() {

    const layer = new THREE.Group()
    layer.name = 'DebugHelper_Axes'

    const helper = new THREE.AxesHelper(1)
    layer.add(helper)

    return layer
  }

  /**
   * 显示3d模型边界
   * @param {boolean} visible
   * @param {THREE.Object3D | THREE.Box3} object
   * @param {*} params
   */
  enableBorderHelper(visible, object, params){
    if (!this.borderLayer) {

      this.borderLayer = this._createBorderHelper(object, params)
      this.root.add(this.borderLayer)
    }

    this.borderLayer.visible = visible
  }

  /**
   * 更新3d模型边界
   * 
   * 最好在visible == true的才能执行该方法
   * 
   * @param {THREE.Object3D | THREE.Box3} object 
   * @returns 
   */
  updateBorderHelper(object) {
    if (!this.borderLayer) return

    const box = this.borderLayer.userData.box
    const helper = this.borderLayer.userData.helper

    if (!box || !helper) return

    if (object instanceof THREE.Box3) {
      box.copy(object)
    } else if (object instanceof THREE.Object3D) {
      box.setFromObject(object)
    } else {
      console.warn('DebugHelper: Invalid target for updateBorderHelper')
      return
    }

    // 强制刷新 helper（关键！）
    helper.box = box
    helper.updateMatrixWorld(true)
  }

  _createBorderHelper(object, options){

    const color = options?.color ?? 0xffff00

    let box

    if (object instanceof THREE.Box3) {
      box = object.clone()
    } else if (object instanceof THREE.Object3D) {
      box = new THREE.Box3().setFromObject(object)
    } else {
      console.warn('DebugHelper: Invalid target for BorderHelper')
      return null
    }

    const layer = new THREE.Group()
    layer.name = 'DebugHelper_Border'

    const helper = new THREE.Box3Helper(box, color)

    //保存引用 方便直接修改而不是创建
    layer.userData.box = box
    layer.userData.helper = helper

    layer.add(helper)

    return layer
  }

  /**
   * 启用坐标原点标记 (0,0,0)
   * @param {boolean} visible
   * @param {object} params
   */
  enableOriginHelper(visible, params) {

    if (!this.originLayer) {
      this.originLayer = this._createOriginHelper(params)
      this.root.add(this.originLayer)
    }

    this.originLayer.visible = visible
  }

  _createOriginHelper(options) {

    const size = options?.size ?? 0.1
    const color = options?.color ?? 0xff0000

    const layer = new THREE.Group()
    layer.name = 'DebugHelper_Origin'

    // 小球标记原点
    const geometry = new THREE.SphereGeometry(size, 16, 16)
    const material = new THREE.MeshBasicMaterial({
      color,
      depthTest: false,
      depthWrite: false,
      toneMapped: false
    })

    const sphere = new THREE.Mesh(geometry, material)
    sphere.position.set(0, 0, 0)

    layer.add(sphere)

    return layer
  }

  /**
   * 清理所有Helper
   */
  clear() {

    this.root.traverse(obj => {

      obj.dispose?.()

      if (obj.geometry) obj.geometry.dispose()
      if (obj.material) obj.material.dispose()
    })

    while (this.root.children.length) {
      this.root.remove(this.root.children[0])
    }

    this.groundGridLayer = null
    this.axesLayer = null
    this.borderLayer = null
    this.originLayer = null
  }

  /**
   * 销毁整个 DebugHelper（彻底卸载）
   */
  dispose() {

    // 1. 清空 helper
    this.clear()

    // 2. 从 scene 移除 root
    if (this.root) {
      this.scene.remove(this.root)
    }

    // 3. 清理引用
    this.root = null
    this.scene = null

    this.groundGridLayer = null
    this.axesLayer = null
    this.borderLayer = null
    this.originLayer = null
  }
}




