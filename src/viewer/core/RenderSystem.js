import * as THREE from 'three'
import { ModelManager } from '../model/ModelManager.js'

/**
 * 画面渲染系统
 *
 * 只处理场景渲染
 */
export class RenderSystem {

  /**
   * 实例化一个新的 画面渲染系统
   *
   * @param {HTMLDivElement} container Render 挂载的 DOM 容器
   * @param {Object} options
   */
  constructor(container, options) {
    this.container = container

    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0xbfd1e5)

    const w = container.clientWidth
    const h = container.clientHeight

    this.camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 1000)
    this.camera.position.set(0, 1.5, 3)

    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setSize(w, h)
    this.renderer.shadowMap.enabled = true

    container.appendChild(this.renderer.domElement)
  }

  render() {
    this.renderer.render(this.scene, this.camera)
  }

  resize() {
    const w = this.container.clientWidth
    const h = this.container.clientHeight

    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()

    this.renderer.setSize(w, h)
  }

  /**
   * 固定相机的位置和角度
   *
   * 固定相机的位置和视角中心，让几何体在画面中间
   *
   * @param {ModelManager} modelManager 需要提供 size 和 center 参数
   */
  fitCamera(modelManager) {
    const size = modelManager.size
    const center = modelManager.center

    const max = Math.max(size.x, size.y, size.z)

    const distance = max / Math.tan((this.camera.fov * Math.PI / 180) / 2)

    this.camera.position.copy(center).add(new THREE.Vector3(distance, distance, distance))
    this.camera.lookAt(center)
  }

  /**
   * 销毁 RenderSystem（释放 WebGL + DOM）
   */
  dispose() {

    // 1. 销毁 renderer
    if (this.renderer) {
      this.renderer.dispose()

      // 强制释放 GPU 上下文
      this.renderer.forceContextLoss?.()
    }

    // 2. 从 DOM 移除 canvas
    if (this.renderer?.domElement && this.container) {
      this.container.removeChild(this.renderer.domElement)
    }

    // 3. 清理引用
    this.scene = null
    this.camera = null
    this.renderer = null
    this.container = null
  }

}
