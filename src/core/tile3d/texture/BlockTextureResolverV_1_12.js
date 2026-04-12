import { BlockTextureResolver } from "./BlockTextureResolver.js"

export class BlockTextureResolverV_1_12  extends BlockTextureResolver{

  /**
   * @param {object} table BLOCK_TEXTURE_TABLE（按版本加载）
   * @param {string} basePath 贴图根路径
   */
  constructor(table, basePath) {
    super(table, basePath)
  }

  /**
   * 解析 block namespace 对应的贴图路径
   *
   * @param {string} namespace    如 "minecraft:stone:2" / "littletiles:ltcoloredblock"
   * @returns {string|null} 完整的路径 basePath/blocks/stone.png
   */
  resolve(namespace) {
    if (!namespace) return null

    const parts = namespace.split(':')
    const mod = parts[0]
    let blockName = parts[1]
    const meta = parts[2] != null ? Number(parts[2]) : 0

    if (!mod || !blockName) return null

    const modTable = this.table.mods[mod]
    if (!modTable) return null

    if(mod === 'flatcoloredblocks'){
      blockName = blockName.replace(/\d+$/, '')//去除结尾的数字
    }

    const blockId = `${mod}:${blockName}`
    const blockInfo = modTable[blockId]
    if (!blockInfo) return null

    let picName = null

    if (blockInfo.meta && blockInfo.meta[meta] != null) {
      picName = blockInfo.meta[meta].pic
    } else if (blockInfo.pic) {
      picName = blockInfo.pic
    }

    if (!picName || picName.length === 0) return null

    return this.basePath + "/" + mod + "/blocks/" + picName + '.png'
  }

}

export { BlockTextureResolverV_1_12 as BlockTextureResolver }
