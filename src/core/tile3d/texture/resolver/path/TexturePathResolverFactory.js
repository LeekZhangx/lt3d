import { TEXTURE_PATH_CONFIG } from "../../../../config.js"
import { LT_VERSION } from "../../../../version/LtVersion.js"
import { TexturePathResolver } from "./TexturePathResolver.js"
import { TexturePathResolverV_1_12 } from "./TexturePathResolverV_1_12.js"
import { TexturePathResolverV_1_21 } from "./TexturePathResolverV_1_21.js"

/**
 * 根据版本创建对应的 TexturePathResolver
 */
export class TexturePathResolverFactory {

  /**
   * 根据版本获取相应的 BlockTextureResolver
   *
   * @param {LT_VERSION} version
   * @returns {TexturePathResolver} 对应版本的TexturePathResolver
   */
  static create(version) {
    switch (version) {

      case LT_VERSION.V_1_12:
        return new TexturePathResolverV_1_12(
          LT_VERSION.V_1_12,
          TEXTURE_PATH_CONFIG[LT_VERSION.V_1_12]
        )

      case LT_VERSION.V_1_21:
        return new TexturePathResolverV_1_21(
          LT_VERSION.V_1_21,
          TEXTURE_PATH_CONFIG[LT_VERSION.V_1_21]
        )

      default:
        throw new Error(`TexturePathResolverFactory not found. Unsupported version: ${version}`)
    }
  }
}
