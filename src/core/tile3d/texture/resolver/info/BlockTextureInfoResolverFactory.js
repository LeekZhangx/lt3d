import { LT_VERSION } from "../../../../version/LtVersion.js"
import { BlockTextureInfoResolver } from "./BlockTextureInfoResolver.js"
import { BlockTextureInfoResolverV_1_12 } from "./BlockTextureInfoResolverV_1_12.js"
import { BlockTextureInfoResolverV_1_21 } from "./BlockTextureInfoResolverV_1_21.js"
import { BLOCK_TEXTURE_TABLE_1_12 } from "../../data/BlockTextureTable_v1.12.js"

export class BlockTextureInfoResolverFactory {

  /**
   * 根据版本获取相应的 BlockTextureResolver
   *
   * @param {LT_VERSION} version
   * @returns {BlockTextureInfoResolver} 带有对应版本table和texturePath的实例对象
   */
  static create(version) {
    switch (version) {

      case LT_VERSION.V_1_12:
        return new BlockTextureInfoResolverV_1_12(
          [
            BLOCK_TEXTURE_TABLE_1_12
          ]
        )

      case LT_VERSION.V_1_21:
        return new BlockTextureInfoResolverV_1_21(
          []
        )

      default:
        throw new Error(`BlockTextureResolver not found. Unsupported version: ${version}`)
    }
  }
}
