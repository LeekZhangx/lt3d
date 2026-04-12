import * as THREE from 'three'

/**
 * 材质缓存对象
 *
 * 使用时需初始化注入 THREE.LoadingManager
 */
export class TextureCache {

  static cache = new Map()
  /**
   * THREE.TextureLoader
   */
  static loader = null
  static fallbackTexture = null

  /**
   * 初始化贴图加载器
   *
   * @param {THREE.LoadingManager} manager 贴图加完完毕，通知进行画面渲染的管理器
   */
  static init(manager) {
    this.loader = new THREE.TextureLoader(manager)
  }

  /**
   * 通过材质路径获取材质，使用路径名称作为缓存key
   *
   * @param {string} path
   * @param {string} name textureName
   * @returns
   */
  static get(path, name) {

    if (!this.loader) {
      throw new Error("TextureCache not initialized")
    }

    if (this.cache.has(path)) {
      return this.cache.get(path)
    }

    // 异步加载实际纹理
    let texture = this.loader.load(
      path,
      (tex) => {
        // onLoad - 加载成功，更新缓存和纹理
        texture.image = tex.image

        texture.needsUpdate = true
      },
      undefined, // onProgress
      (err) => {
        // onErr - 加载失败，保持使用fallback纹理
        console.warn("Texture load failed, path:", path, err)

        const errTexture = this._createFallbackTexture()

        //只替换image 更换texture会让引用错误
        texture.image = errTexture.image

        texture.name = name + '_load_error'
        texture.needsUpdate = true
      }
    )

    this.cache.set(path, texture)

    texture.name = name

    texture.colorSpace = THREE.SRGBColorSpace
    texture.magFilter = THREE.NearestFilter
    texture.minFilter = THREE.NearestFilter
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping

    return texture
  }

  /**
   * 纹理缺失 紫黑棋盘色块
   * @returns
   */
  static _createFallbackTexture() {
    if (this.fallbackTexture) {
      return this.fallbackTexture
    }

    // 创建棋盘格纹理
    const size = 16  // 纹理尺寸
    const gridSize = 8  // 每个方块的大小（像素），越小格子越密

    const color1 = '#ff00ff'
    const color2 = '#000000'

    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')

    // 绘制棋盘格
    for (let i = 0; i < size / gridSize; i++) {
      for (let j = 0; j < size / gridSize; j++) {
        // 根据行列判断颜色
        if ((i + j) % 2 === 0) {
          ctx.fillStyle = color1  // 品红色
        } else {
          ctx.fillStyle = color2 // 黑色
        }
        ctx.fillRect(i * gridSize, j * gridSize, gridSize, gridSize)
      }
    }

    const texture = new THREE.CanvasTexture(canvas)

    texture.colorSpace = THREE.SRGBColorSpace
    texture.magFilter = THREE.NearestFilter
    texture.minFilter = THREE.NearestFilter
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping

    texture.needsUpdate = true

    this.fallbackTexture = texture
    return texture
  }

  /**
   * 清空cache缓存，但不销毁整个 TextureCache
   */
  static clear() {
    for (const tex of this.cache.values()) {
      if (tex && tex.dispose) tex.dispose() // 释放 GPU 内存
    }
    this.cache.clear()
  }

  /**
   * 销毁 TextureCache
   */
  static dispose() {
    this.clear()

    if (this.fallbackTexture && this.fallbackTexture.dispose) {
      this.fallbackTexture.dispose()
    }
    this.fallbackTexture = null
    this.loader = null
  }
}
