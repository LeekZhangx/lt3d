import { LT_VERSION } from "../../../../version/LtVersion.js"
import { BlockType } from "./BlockType.js"

/**
 * BlockTypeResolver
 * 
 * 负责：
 * 
 * - 特殊 block type 展开
 * - 将 type 转换成最终 textures 结构
 * - 补充 face rotation 信息
 */
export class BlockTypeResolver {

  /**
   * 
   * @param {LT_VERSION} ltVersion 
   * @param {object} blockTypeTable BlockTypeTable 按版本注入
   */
  constructor(ltVersion, blockTypeTable) {
    this.ltVersion = ltVersion
    this.blockTypeTable = blockTypeTable
  }

  /**
   * 解析方块类型
   *
   * @param {object} info BlockInfoResolver提供的info
   * @returns {object} BlockTypeTable 中对应的数据信息
   */
  resolve(blockType) {

    if (!blockType) {
      return null
    }

    switch (blockType) {

      case BlockType.GLAZED_TERRACOTTA:
        return this._resolveGlazedTerracotta(blockType)

      default:
        return null
    }
  }

  /**
   * 解析 带釉彩色陶瓦
   * 
   * 从 BlockTypeTable 中读取 face rotation 信息
   * 
   * 所有面共用一个贴图
   * 但每个面的 UV rotation 不同
   *
   * @param {object} blockType
   * @returns {object} 六面贴图的旋转角度
   */
  _resolveGlazedTerracotta(blockType) {

    const info = this.blockTypeTable?.[blockType]?.elements?.[0].faces

    const res = {
      "up":   info.up.rotation,
      "down": info.down.rotation,
      "north":  info.north.rotation,
      "south": info.south.rotation,
      "west": info.west.rotation,
      "east": info.east.rotation,
    }

    return res
  }
}