import { LT_VERSION } from "../../../../version/LtVersion.js"
import { TextureSetType } from "../../texset/TextureSetType.js"
import { BlockTextureInfoResolver } from "./BlockTextureInfoResolver.js"
/**
 * 该版本方块命名方式扁平化，大部分可以直接匹配纹理
 */
export class BlockTextureInfoResolverV_1_21 extends BlockTextureInfoResolver{

  /**
   * @param {object} table BLOCK_TEXTURE_TABLE（按版本加载）
   */
  constructor(table) {
    super(LT_VERSION.V_1_21, table)
  }


  /**
   * 解析 block namespace 对应的纹理路径
   *
   * - mc 1.13后命名扁平化，数值型元数据被移除
   * - 1.21的 BlockTextureTable 只提供了多纹理方块的结构信息，没有查询到的 方块名称 会直接返回单贴图的结构
   * 
   * 注意
   *  由于采取扁平化命名，大部分单个纹理的方块会直接通过 方块名称 直接获取
   * 
   *  但是，对于多纹理贴图的方块，则是要返回相应的对象
   * 
   *  所以，没有命中的 方块名称 不会警告，而是会返回单贴图的结构
   *
   * @param {string} namespace    如 "minecraft:stone" / "littletiles:ltcoloredblock"
   *  - 不携带元数据的方块命名
   *  - 不携带属性值 如 minecraft:magenta_glazed_terracotta[facing=south]
   *
   * @returns {object|null}
   */
  resolve(namespace) {
    if (!namespace) return null

    const parts = namespace.split(':')
    const mod = parts[0]
    let blockName = parts[1]
    //高版本中没有meta数据

    if (!mod || !blockName){
      console.warn("Mod name or block name not found. Block namespace: " + namespace);
      return null
    }

    const singleTexBlock = {
        type: TextureSetType.SINGLE,
        mod: mod,
        textures: {"all": blockName}
      }

    const modTable = this.mergedTable.mods[mod]
    if (!modTable){
      // mod 未找到 直接按照单纹理返回
      return singleTexBlock
    }

    if(mod === 'flatcoloredblocks'){
      blockName = blockName.replace(/\d+$/, '')//去除结尾的数字
    }

    const blockId = `${mod}:${blockName}`
    const blockInfo = modTable[blockId]
    if (!blockInfo){
      // 方块信息 未找到 直接按照单纹理返回
      return singleTexBlock
    }

    return {
        type: TextureSetType.MULTIPLE,
        mod: mod,
        textures: blockInfo.textures,
        axis: blockInfo.axis,
        x: blockInfo.x || 0,
        y: blockInfo.y || 0,
      }
  }

}

