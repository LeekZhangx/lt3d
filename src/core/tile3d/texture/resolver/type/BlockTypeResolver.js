import { LT_VERSION } from "../../../../version/LtVersion.js"
import { BlockType } from "./BlockType.js"

/**
 * BlockTypeResolver 抽象类
 * 
 * 特殊方块纹理布局信息解析
 * 
 * - 将 方块贴图类型 blockType 转换成最终 纹理贴图布局 结构
 * - 补充 各个面的贴图旋转 rotation 信息
 * 
 * 由于纹理贴图的方块类型基本上都是 minecraft 的，这里没有动态注册 blockTypeTable 的功能
 */
export class BlockTypeResolver {

  /**
   * 
   * @param {keyof typeof LT_VERSION} ltVersion lt版本
   * @param {object} blockTypeTable BlockTypeTable 按版本注入
   */
  constructor(ltVersion, blockTypeTable) {

    if (new.target === BlockTypeResolver) {
      throw new Error("BlockTypeResolver cannot be instantiated.")
    }

    this.ltVersion = ltVersion
    this.blockTypeTable = blockTypeTable
  }

  /**
   * 解析方块类型
   *
   * @abstract
   * @param {keyof typeof BlockType} blockType 方块类型，决定了纹理贴图的布局展示方式
   * @returns {object} BlockTypeTable 中对应 blockType 的纹理布局信息
   */
  resolve(blockType) {
    throw new Error('resolve() must be implemented')
  }

}