import { LT_VERSION } from "../../version/LtVersion.js"
import { BlockTextureResolver } from "./BlockTextureResolver.js"
/**
 * 该版本方块命名方式扁平化，大部分可以直接匹配纹理
 */
export class BlockTextureResolverV_1_21 extends BlockTextureResolver{

  /**
   * @param {object} table BLOCK_TEXTURE_TABLE（按版本加载）
   * @param {string} basePath 纹理根路径
   */
  constructor(table, basePath) {
    super(LT_VERSION.V_1_21, null, basePath)
  }

  /**
   * @override
   * 
   * 高版本不需要该功能
   */
  registerTable(table, { priority = 'high' } = {}) {
    console.info('BlockTextureResolverV_1_21 not support this function, higher lt version is not need this.')
  }

  /**
   * 解析 block namespace 对应的纹理路径
   *
   * - mc 1.13后命名扁平化，数值型元数据被移除
   *
   * @param {string} namespace    如 "minecraft:stone" / "littletiles:ltcoloredblock"
   *  - 不携带元数据的方块命名
   *  - 不携带属性值 如 minecraft:magenta_glazed_terracotta[facing=south]
   *
   * @returns {string|null} 完整的路径 basePath/blocks/stone.png
   */
  resolve(namespace) {
    if (!namespace) return null

    const parts = namespace.split(':')
    const mod = parts[0]
    let blockName = parts[1]
    //高版本中没有meta数据

    if (!mod || !blockName) return null

    if(mod === 'flatcoloredblocks'){
      blockName = blockName.replace(/\d+$/, '')//去除结尾的数字
    }

    let picName = blockName

    return this.basePath + "/" + mod + "/block/" + picName + '.png'
  }

}

