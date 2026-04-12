import { TEXTURE_PATH_CONFIG } from "../../config"
import { LT_VERSION } from "../../version/LtVersion"
import { BlockTextureResolver } from "./BlockTextureResolver"
import { BlockTextureResolverV_1_12 } from "./BlockTextureResolverV_1_12"
import { BlockTextureResolverV_1_21 } from "./BlockTextureResolverV_1_21"
import { BLOCK_TEXTURE_TABLE_1_12 } from "./data/BlockTextureTable_v1.12"

export class BlockTextureResolverFactory {

  /**
   * 根据版本获取相应的 BlockTextureResolver
   *
   * @param {LT_VERSION} version
   * @returns {BlockTextureResolver} 带有对应版本table和texturePath的实例对象
   */
  static create(version) {
    switch (version) {

      case LT_VERSION.V_1_12:
        return new BlockTextureResolverV_1_12(
          BLOCK_TEXTURE_TABLE_1_12,
          TEXTURE_PATH_CONFIG[LT_VERSION.V_1_12]
        )

      case LT_VERSION.V_1_21:
        return new BlockTextureResolverV_1_21(
          null,
          TEXTURE_PATH_CONFIG[LT_VERSION.V_1_21]
        )

      default:
        throw new Error(`BlockTextureResolver not found. Unsupported version: ${version}`)
    }
  }
}
