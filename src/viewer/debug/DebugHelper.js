import { RectGridHelper } from '../helper/RectGridHelper'
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

    this.groundGridLayer = null
    this.axesLayer = null
    this.borderLayer = null
  }

  /**
   * 启用地面网格
   * @param {boolean} visible
   * @param {object} params
   */
  enableGroundGridHelper(visible, params){

    if (!this.groundGridLayer) {

      this.groundGridLayer = this._createGroundGridHelper(params)
      this.root.add(this.groundGridLayer)
    }

    this.groundGridLayer.visible = visible

  }


  _createGroundGridHelper(options) {

    const size = options?.size ?? {x:10, y:10, z:10}
    // const divisions = options?.divisions ?? {x:10, y:10, z:10}
    // const position = options?.size ? new THREE.Vector3(options.size.x, 0, options.size.z) :  new THREE.Vector3(0, 0, 0)

    const layer = new THREE.Group()
    layer.name = 'DebugHelper_GroundGrid'

    let x = Math.ceil(size.x) + 1
    let y = Math.ceil(size.y) + 1
    let z = Math.ceil(size.z) + 1

    const helper = new RectGridHelper(
      x, z,
      x, z)
    helper.position.set(x / 2, 0 , z / 2)
    layer.add(helper)

    return layer
  }

  /**
   * 启用三轴指示
   * @param {boolean} visible
   * @param {object} param
   */
  enableAxesHelper(visible, param){

    if (!this.axesLayer) {

      this.axesLayer = this._createAxesHelper(param)
      this.root.add(this.axesLayer)
    }

    this.axesLayer.visible = visible

  }

  _createAxesHelper(options) {

    const size = options?.size ?? 20

    const layer = new THREE.Group()
    layer.name = 'DebugHelper_Axes'

    const helper = new THREE.AxesHelper(size)
    layer.add(helper)

    return layer
  }

  /**
   * 显示3d模型边界
   * @param {boolean} visible
   * @param {THREE.Object3D} object
   * @param {*} params
   */
  enableBorderHelper(visible, object, params){
    if (!this.borderLayer) {

      this.borderLayer = this._createBorderHelper(object, params)
      this.root.add(this.borderLayer)
    }

    this.borderLayer.visible = visible
  }

  _createBorderHelper(object, options){

    const color = options?.color ?? 0xffff00

    const box = new THREE.Box3()
    box.setFromObject(object)

    const layer = new THREE.Group()
    layer.name = 'DebugHelper_Border'

    const helper = new THREE.Box3Helper(box, color)
    layer.add(helper)

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
  }
}




