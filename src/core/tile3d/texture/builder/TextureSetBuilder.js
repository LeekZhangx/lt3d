import { LT_VERSION } from "../../../version/LtVersion.js"
import { BlockTextureInfoResolver } from "../resolver/info/BlockTextureInfoResolver.js"
import { TexturePathResolver } from "../resolver/path/TexturePathResolver.js"
import { BlockTypeResolver } from "../resolver/type/BlockTypeResolver.js"
import { TextureSet } from "../texset/TextureSet.js"
import { TextureManager } from "../TextureManager.js"

/**
 * TextureSetBuilder抽象类
 * 
 * 纹理集合构建器
 * 
 * 将 纹理信息对象
 * 转换为渲染可用的纹理结构
 *
 */
export class TextureSetBuilder {

  /**
   * @abstract
   * 
   * @param {keyof typeof LT_VERSION} ltVersion lt版本
   * @param {TextureManager} textureManager
   */
  constructor(ltVersion, textureManager) {

    if (new.target === TextureSetBuilder) {
      throw new Error("TextureSetBuilder cannot be instantiated.")
    }

    this.ltVersion = ltVersion
    this.textureManager = textureManager

  }

  /**
   * 构建纹理集合
   *
   * @abstract
   * 
   * @param {string} namespace 方块的命名空间
   * @param {BlockTextureInfoResolver} infoResolver 对应版本的 BlockTextureInfoResolver
   * @param {BlockTypeResolver} blockTypeResolver 对应版本的 BlockTypeResolver
   * @param {TexturePathResolver} pathResolver 对应版本的 TexturePathResolver
   * @returns {TextureSet} 实例对象
   */
  build(namespace, infoResolver, blockTypeResolver, pathResolver) {
    throw new Error('build() must be implemented')
  }

  /**
   * fallback 纹理
   * 
   * 找不到对应纹理使用
   */
  _fallback() {
    return this.textureManager.get(null, '__fallback__')
  }

}

