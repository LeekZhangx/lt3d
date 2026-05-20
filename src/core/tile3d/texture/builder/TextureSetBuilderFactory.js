import { LT_VERSION } from "../../../version/LtVersion.js"
import { TextureManager } from "../TextureManager"
import { TextureSetBuilderV_1_12 } from "./TextureSetBuilderV_1_12"
import { TextureSetBuilderV_1_21 } from "./TextureSetBuilderV_1_21"

/**
 *  方块纹理贴图信息解析器工厂
 * 
 * - 根据不同的版本返回对应的 TextureSetBuilderFactory
 * 
 */
export class TextureSetBuilderFactory {

  /**
   * 根据版本获取相应的 BlockTextureResolver
   *
   * @param {LT_VERSION} version
   * @param {TextureManager} textureManager 
   * @returns {TextureSetBuilder} 对应版本的 TextureSetBuilder 实例对象
   */
  static create(version, textureManager) {
    switch (version) {

      case LT_VERSION.V_1_12:
        return new TextureSetBuilderV_1_12(textureManager)

      case LT_VERSION.V_1_21:
        return new TextureSetBuilderV_1_21(textureManager)

      default:
        throw new Error(`TextureSetBuilderFactory not found. Unsupported version: ${version}`)
    }
  }
}
