import * as THREE from 'three'

/**
 * 场景中 主要模型 管理器
 */
export class ModelManager {

  /**
   *
   * @param {THREE.Scene} scene
   */
  constructor(scene) {
    this.scene = scene
    this.modelRoot = null

    /**
     * 模型包围盒
     */
    this.box = new THREE.Box3()
    this.size = new THREE.Vector3()
    this.center = new THREE.Vector3()
  }

  /**
   * 设置新的3D对象，如有旧的存在，会清除
   *
   * @param {THREE.Object3D} obj
   */
  setModel(obj) {
    if (this.modelRoot) {
      this.scene.remove(this.modelRoot)
    }

    // this._fitToCenterAndGround(obj)

    this.modelRoot = obj
    this.scene.add(obj)

    this.analyze()
  }

  /**
   * 模型居中到 X=0, Z=0 ,Y贴地
   *
   * @param {THREE.Object3D} object
   */
  _fitToCenterAndGround(object) {
    const box = new THREE.Box3().setFromObject(object)

    const center = box.getCenter(new THREE.Vector3())

    // 底部 y
    const minY = box.min.y

    // 平移量
    const offset = new THREE.Vector3(
      -center.x,   // x居中
      -minY,       // 贴地
      -center.z    // z居中
    )

    object.position.add(offset)
  }

  /**
   * 获取当前3D对象
   */
  getModel() {
    return this.modelRoot
  }

  /**
   * 清除当前场景中的3D对象
   */
  clearModel(){
    if (this.modelRoot) {
      this.scene.remove(this.modelRoot)
    }

  }

  /**
   * 解析当前几何体的 尺寸 和 中心位置，
   *
   * 并赋值给当前的 ModelManager 的 size 和 center 属性
   *
   * @returns {boolean} 成功解析返回 true
   */
  analyze() {
    this.box.setFromObject(this.modelRoot)

    if (this.box.isEmpty()) return false

    this.box.getSize(this.size)
    this.box.getCenter(this.center)

    return true
  }

  /**
   * 深度释放3D模型资源（不可再使用）
   */
  disposeModel() {
    if (!this.modelRoot) return

    this.modelRoot.traverse((child) => {
      if (child.isMesh) {

        child.geometry?.dispose?.()

        if (Array.isArray(child.material)) {
          child.material.forEach(m => m?.dispose?.())
        } else {
          child.material?.dispose?.()
        }

      }
    })

    this.scene.remove(this.modelRoot)
    this.modelRoot = null
  }

  /**
   * 销毁 ModelManager
   */
  dispose(){

    this.clearModel()
    this.disposeModel()

    this.scene = null
    this.modelRoot = null

    this.box = null
    this.size = null
    this.center = null
  }
}
