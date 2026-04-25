import * as THREE from 'three'

/**
 * 材质缓存对象
 *
 * 使用时需初始化注入 THREE.LoadingManager
 */
export class TextureCache {

  /**
   * 
   * @param {THREE.LoadingManager | null} manager 资源加载管理器，非必须
   */
  constructor(manager) {

    this.cache = new Map()
    this.loader = new THREE.TextureLoader(manager)
    this.fallbackTexture = null

  }


  /**
   * 通过材质路径获取材质，使用路径名称作为缓存key
   *
   * @param {string} path
   * @param {string} name textureName
   * @returns
   */
  get(path, name) {
    
    if (this.cache.has(path)) {
      return this.cache.get(path)
    }

    const fallback = this._createFallbackTexture()

    let texture = new THREE.Texture()
    texture.image = fallback.image
    texture.needsUpdate = true
    
    // 异步加载实际纹理
    if(path){
      texture.name = name

      this.loader.load(
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

          texture.name = name + '_load_error'
        }
      )

      this.cache.set(path, texture)
    }else{
      texture.name = name
    }

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
  _createFallbackTexture() {
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
   * 获取纹理缓存
   * 
   * key: 纹理路径（string）
   * value: THREE.Texture
   * 
   * @returns {Map<string, THREE.Texture>}
   */
  getCache() {
    return this.cache
  }

  /**
   * 清空cache缓存，但不销毁整个 TextureCache
   */
  clear() {
    this.cache.forEach(tex => tex.dispose())
    this.cache.clear()
  }

  /**
   * 销毁 TextureCache
   */
  dispose() {
    this.clear()

    if (this.fallbackTexture?.dispose) {
      this.fallbackTexture.dispose()
    }

    this.fallbackTexture = null
    this.loader = null
  }
}
