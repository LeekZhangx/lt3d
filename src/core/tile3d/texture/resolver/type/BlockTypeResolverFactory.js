import { LT_VERSION } from "../../../../version/LtVersion.js"
import { BLOCK_TYPE_TABLE_1_12 } from "../../data/BlockTypeTable_v1.12.js"
import { BlockTypeResolver } from "./BlockTypeResolver.js"

export class BlockTypeResolverFactory {

  /**
   * 根据版本获取相应的 BlockTextureResolver
   *
   * @param {LT_VERSION} version
   * @returns {BlockTypeResolver} 带有对应版本table和texturePath的实例对象
   */
  static create(version) {
    switch (version) {

      case LT_VERSION.V_1_12:
        return new BlockTypeResolver(
          version,
          BLOCK_TYPE_TABLE_1_12
        )

      case LT_VERSION.V_1_21:
        return new BlockTypeResolver(
          version,
          BLOCK_TYPE_TABLE_1_12
        )

      default:
        throw new Error(`BlockTypeResolver not found. Unsupported version: ${version}`)
    }
  }
}
