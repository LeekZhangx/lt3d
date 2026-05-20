import { LT_VERSION } from "../../../../version/LtVersion.js"
import { BlockType } from "./BlockType.js"
import { BlockTypeResolver } from "./BlockTypeResolver.js"

/**
 * BlockTypeResolver 1.21 实现类
 * 
 * 方块纹理布局信息解析器
 * 
 * - 将 方块贴图类型 blockType 转换成最终 纹理贴图布局 结构
 * - 补充 各个面的贴图旋转 rotation 信息
 */
export class BlockTypeResolverV_1_21 extends BlockTypeResolver{

  /**
   * 
   * @param {object} blockTypeTable BlockTypeTable 按版本注入
   */
  constructor(blockTypeTable) {
    super(LT_VERSION.V_1_21, blockTypeTable)
  }

  /**
   * 解析方块类型
   *
   * @param {keyof typeof BlockType} blockType 方块类型，决定了纹理贴图的布局展示方式
   * @returns {object} BlockTypeTable 中对应的纹理布局信息
   */
  resolve(blockType) {

    if (!blockType) {
      return null
    }

    switch (blockType) {

      case BlockType.TEMPLATE_GLAZED_TERRACOTTA:
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

    const info = this.blockTypeTable?.[blockType]?.elements[0].faces
    
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