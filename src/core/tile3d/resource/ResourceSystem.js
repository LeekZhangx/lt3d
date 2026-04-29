import { LT_VERSION } from "../../version/LtVersion.js"
import { BlockTextureInfoResolver } from "../texture/resolver/info/BlockTextureInfoResolver.js"
import { BlockTextureInfoResolverFactory } from "../texture/resolver/info/BlockTextureInfoResolverFactory.js"
import { TexturePathResolver } from "../texture/resolver/path/TexturePathResolver.js"
import { TexturePathResolverFactory } from "../texture/resolver/path/TexturePathResolverFactory.js"
import { TextureSetBuilder } from "../texture/TextureSetBuilder.js"
import { TextureManager } from "../texture/TextureManager.js"
import { TextureSet } from "../texture/texset/TextureSet.js"

/**
 * 资源系统
 * 
 * 主要处理纹理和材质的管理和缓存
 * 
 * 
 */
export class ResourceSystem {

  /**
   * 
   * @param {THREE.LoadingManager} loadingManager 
   * @param {number} anisotropy 各向异性值
   */
  constructor(loadingManager, anisotropy) {
    this.loadingManager = loadingManager

    this.textureManager = new TextureManager(loadingManager, anisotropy)

    this.infoResolvers = new Map()
    this.pathResolvers = new Map()
    this.builder = null

  }

  /**
   * 设置生成的贴图 各向异性 值
   * 
   * @param {number} val 
   */
  setAnisotropy(val){
    this.textureManager.anisotropy = val
  }

  /**
   * 获取 各向异性 值
   * 
   * @returns {number}  
   */
  getAnisotropy(){
    return this.textureManager.anisotropy
  }

  /**
   * 获取 BlockTextureInfoResolver 对象
   * 
   * @param {keyof typeof LT_VERSION} version 
   * 
   * @returns {BlockTextureInfoResolver}
   */
  getInfoResolver(version) {
    if (!this.infoResolvers.has(version)) {
      const resolver = BlockTextureInfoResolverFactory.create(version)
      this.infoResolvers.set(version, resolver)
    }
    return this.infoResolvers.get(version)
  }

  /**
   * 获取 TexturePathResolver 对象
   * 
   * @param {keyof typeof LT_VERSION} version 
   * 
   * @returns {TexturePathResolver}
   */
  getPathResolver(version) {
    if (!this.pathResolvers.has(version)) {
      const resolver = TexturePathResolverFactory.create(version)
      this.pathResolvers.set(version, resolver)
    }
    return this.pathResolvers.get(version)
  }

  /**
   * 获取 TextureSetBuilder
   * 
   * @returns {TextureSetBuilder} 将方块贴图名称转换为贴图路径的构建器
   */
  getBuilder() {
    if (!this.builder) {

      const builder = new TextureSetBuilder(
        this.textureManager
      )

      this.builder = builder
    }

    return this.builder
  }

  /* ================= 统一入口 ================= */

  /**
   * 获取纹理对象
   * 
   * @param {string} path 纹理路径
   * @param {string} name 纹理名称，作为缓存的key
   * @returns {THREE.Texture}
   */
  getTexture(path, name){
    return this.textureManager.get(path, name)
  }

  /**
   * 独立贴图获取
   * 
   * @param {string} namespace "minecraft:stone:0" 
   * @param {keyof typeof LT_VERSION} ltVersion 
   * @returns {string|null}
   */
  getTexturePath(namespace, ltVersion) {

    const infoResolver = this.getInfoResolver(ltVersion)
    const pathResolver = this.getPathResolver(ltVersion)

    const info = infoResolver.resolve(namespace)

    if (!info) return null

    const { textures, mod } = info

    if (!textures) return null

    /**
     * 选一个“代表贴图”
     */
    const pickName = () => {

      // 优先级：all > side > top > bottom > 任意
      if (textures.all) return textures.all
      if (textures.side) return textures.side
      if (textures.top) return textures.top
      if (textures.bottom) return textures.bottom

      // fallback：取第一个
      const keys = Object.keys(textures)
      return keys.length ? textures[keys[0]] : null
    }

    let name = pickName()

    // 支持 #引用
    while (typeof name === 'string' && name.startsWith('#')) {
      const ref = name.slice(1)
      name = textures[ref]
    }

    if (!name) return null

    return pathResolver.resolve(mod, name)
  }



  /* ================= 扩展接口 ================= */

  /**
   * 添加新的 TextureTable
   * 
   * @param {keyof typeof LT_VERSION} ltVersion 
   * @param {object} table 
   */
  registerTextureTable(ltVersion, table) {
    const resolver = this.getInfoResolver(ltVersion)
    resolver.registerTable(table)
  }

  /**
   * 构建上下文（Build Context）
   * 每次 LtMeshBuilder.build 时创建，用于提供资源访问能力
   * 
   * @typedef {Object} BuildContext
   * @property {keyof typeof LT_VERSION} version 当前 lt 版本
   * @property {(namespace: string) => THREE.Texture | null} getTextureSet 获取纹理
   */

  /**
   * 创建 LtMeshBuilder 构建时使用的上下文对象
   * 
   * @param {keyof typeof LT_VERSION} ltVersion lt 版本
   * @returns {BuildContext}
   */
  createBuildContext(ltVersion) {

    const infoResolver = this.getInfoResolver(ltVersion)
    const pathResolver = this.getPathResolver(ltVersion)
    const builder = this.getBuilder()

    return {
      ltVersion: ltVersion,

      /**
       * 获取纹理集合
       * @param {string} namespace 
       * @returns {TextureSet} TextureSet 实例对象
       */
      getTextureSet: (namespace) => {

        // 没有找寻到对应的path，也将null传递给textureManager，让其使用默认材质
        const info = infoResolver.resolve(namespace)
        return builder.build(info, pathResolver)

      }
    }
  }

  _buildTextureSet(resolved) {

    if (!resolved) return null

    const { type, textures, basePath, mod } = resolved

    const toPath = (name) => {
      if (!name) return null
      return `${basePath}/${mod}/blocks/${name}.png`
    }

    // === 单贴图 ===
    if (type === 'single') {
      const name = textures.all
      const path = toPath(name)

      return {
        type: 'single',
        map: this.textureManager.get(path, name)
      }
    }

    // === 多贴图 ===
    if (type === 'multiple') {

      const resolve = (...keys) => {
        for (const k of keys) {
          if (textures[k]) {
            const name = textures[k]
            return this.textureManager.get(toPath(name), name)
          }
        }
        return this.textureManager.get(null, 'fallback')
      }

      return {
        type: 'multiple',

        mapPX: resolve('side', 'all'),
        mapNX: resolve('side', 'all'),

        mapPZ: resolve('side', 'all'),
        mapNZ: resolve('side', 'all'),

        mapPY: resolve('top', 'end', 'all'),
        mapNY: resolve('bottom', 'end', 'all')
      }
    }

    return null
  }

  dispose() {
    this.textureManager.dispose()

    this.infoResolvers.clear()
    this.pathResolvers.clear()
    this.builder = null
  }
}