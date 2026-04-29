import { LT_VERSION } from "../../../../version/LtVersion.js"
import { TextureSetType } from "../../texset/TextureSetType.js"
import { BlockTextureInfoResolver } from "./BlockTextureInfoResolver.js"

export class BlockTextureInfoResolverV_1_12  extends BlockTextureInfoResolver{

  /**
   * @param {object} table BLOCK_TEXTURE_TABLE（按版本加载）
   * @param {string} basePath 纹理根路径
   */
  constructor(table) {
    super(LT_VERSION.V_1_12, table)
  }

  /**
   * 解析 block namespace 对应的纹理路径
   * 
   * - 解析结果依赖提供的 BlockTexutureTable
   *
   * @param {string} namespace    如 "minecraft:stone:2" / "littletiles:ltcoloredblock"
   * @returns {object|null}
   */
  resolve(namespace) {
    if (!namespace) return null

    const parts = this._partName(namespace)
    const mod = parts.mod
    let blockName = parts.blockName
    const meta = parts.meta

    if (!mod || !blockName){
      console.warn("Mod name or block name not found. Block namespace: " + namespace);
      return null
    }

    const modTable = this.mergedTable.mods[mod]
    if (!modTable){
      console.warn("Mod texture mapper not found. Block namespace: " + namespace);
      return null
    }
    if(mod === 'flatcoloredblocks'){
      blockName = blockName.replace(/\d+$/, '')//去除结尾的数字
    }

    const blockId = `${mod}:${blockName}`
    const blockInfo = modTable[blockId]
    if (!blockInfo){
      console.warn("Block name not in the texture mapper. Block namespace: " + namespace);
      return null
    }

    // 单纹理
    let picName = null

    // 多纹理
    let textures = null

    // 旋转信息
    let axis = null
    let x = 0
    let y = 0

    // =========================
    // 新：先 resolve meta（支持 ref）
    // =========================
    let metaInfo = null

    if (blockInfo.meta && blockInfo.meta[meta] != null) {
      metaInfo = this._resolveMeta(blockInfo, meta)
    }

    //有meta
    if (metaInfo) {
      picName = metaInfo.pic
      textures = metaInfo.textures

      axis = metaInfo.axis
      x = metaInfo.x || 0
      y = metaInfo.y || 0
    } 
    // 无meta
    else {
      picName = blockInfo.pic
      textures = blockInfo.textures
    }



    // 找寻到对应的单个纹理贴图 返回
    if(picName && picName.length > 0){
      return {
        type: TextureSetType.SINGLE,
        mod: mod,
        textures: {"all": picName}
      }
    }

    // 找寻到对应的多纹理贴图 返回
    if (textures){
      return {
        type: TextureSetType.MULTIPLE,
        mod: mod,
        textures: textures,
        axis,
        x,
        y
      }
    }
    console.log(textures);
    

    console.warn("Block texture not found. Block namespace: " + namespace);

    return null
  }


  _partName(namespace){
    const parts = namespace.split(':')

    return {
      mod : parts[0],
      blockName : parts[1],
      meta : parts[2] != null ? Number(parts[2]) : 0
    }
  }

  _resolveMeta(blockInfo, meta) {
    let current = blockInfo.meta?.[meta]
    if (!current) return null

    const visited = new Set()

    while (current.ref) {

      if (visited.has(current.ref)) {
        console.warn('Meta ref loop:', current.ref)
        break
      }

      visited.add(current.ref)

      const base = blockInfo.meta[current.ref]
      if (!base) break

      current = {
        ...structuredClone(base),
        ...current
      }
    }

    return current
  }

}
