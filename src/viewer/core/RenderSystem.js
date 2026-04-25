import * as THREE from 'three'

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

    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setSize(w, h)
    this.renderer.shadowMap.enabled = true
    
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap

    container.appendChild(this.renderer.domElement)

    /**
     * 当前使用的相机，由CameraSystem提供
     */
    this.camera = null
  }

  /** 设置当前渲染相机 */
  setCamera(camera) {
    this.camera = camera
  }

  render() {
    if (!this.camera) return
    this.renderer.render(this.scene, this.camera)
  }

  resize() {
    const w = this.container.clientWidth
    const h = this.container.clientHeight

    this.renderer.setSize(w, h)
  }


  /**
   * 多视口渲染（用于多相机）
   * @param {Array<{camera: THREE.Camera, x:number, y:number, w:number, h:number}>} views
   */
  renderViews(views) {
    const { renderer, scene } = this

    renderer.setScissorTest(true)

    views.forEach(v => {
      renderer.setViewport(v.x, v.y, v.w, v.h)
      renderer.setScissor(v.x, v.y, v.w, v.h)
      renderer.render(scene, v.camera)
    })

    renderer.setScissorTest(false)
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
