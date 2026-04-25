import { LT_VERSION } from "../../version/LtVersion"
import { BlockTextureResolver } from "../texture/BlockTextureResolver"
import { BlockTextureResolverFactory } from "../texture/BlockTextureResolverFactory"
import { TextureCache } from "../texture/TextureCache"

/**
 * 资源系统
 * 
 * 主要处理纹理和材质的管理和缓存
 * 
 * 
 */
export class ResourceSystem {

  constructor(loadingManager) {
    this.loadingManager = loadingManager

    this.textureCache = new TextureCache(loadingManager)

    this.resolvers = new Map()

  }

  /**
   * 获取 BlockTextureResolver 对象
   * 
   * @param {keyof typeof LT_VERSION} version 
   * 
   * @returns {BlockTextureResolver}
   */
  getResolver(version) {
    if (!this.resolvers.has(version)) {
      const resolver = BlockTextureResolverFactory.create(version)
      this.resolvers.set(version, resolver)
    }
    return this.resolvers.get(version)
  }

  /* ================= 统一入口 ================= */

  /**
   * 
   * @param {string} namespace "minecraft:stone:0" 
   * @param {keyof typeof LT_VERSION} ltVersion 
   * @returns 
   */
  getTexture(namespace, ltVersion) {

    const resolver = this.getResolver(ltVersion)

    const texPath = resolver.resolve(namespace)

    // 没有找寻到对应的path，也将null传递给textureCache，让其使用默认材质

    return this.textureCache.get(texPath)
  }

  /* ================= 扩展接口 ================= */

  /**
   * 添加新的 TextureTable
   * 
   * @param {keyof typeof LT_VERSION} ltVersion 
   * @param {object} table 
   */
  registerTextureTable(ltVersion, table) {
    const resolver = this.getResolver(ltVersion)
    resolver.registerTable(table)
  }

  /**
   * 构建上下文（Build Context）
   * 每次 LtMeshBuilder.build 时创建，用于提供资源访问能力
   * 
   * @typedef {Object} BuildContext
   * @property {keyof typeof LT_VERSION} version 当前 lt 版本
   * @property {(namespace: string) => THREE.Texture | null} getTexture 获取纹理
   */

  /**
   * 创建 LtMeshBuilder 构建时使用的上下文对象
   * 
   * @param {keyof typeof LT_VERSION} ltVersion lt 版本
   * @returns {BuildContext}
   */
  createBuildContext(ltVersion) {

    const resolver = this.getResolver(ltVersion)

    return {
      ltVersion: ltVersion,

      getTexture: (namespace) => {
        const texPath = resolver.resolve(namespace)

        // 没有找寻到对应的path，也将null传递给textureCache，让其使用默认材质

        return this.textureCache.get(texPath)
      }
    }
  }

  dispose() {
    this.textureCache.dispose()
    this.resolvers.clear()
  }
}