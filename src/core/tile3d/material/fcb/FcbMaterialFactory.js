import { Color } from "three"
import { FcbMaterialType } from "./FcbMaterialType.js"
import { GlassMaterialBuilder } from "../builders/GlassMaterialBuilder.js"
import { CommonMaterialBuilder } from "../builders/CommonMaterialBuilder.js"
import { FcbTransfer } from "./FcbTransfer.js"

/**
 * Fcb 材质工厂
 */
export class FcbMaterialFactory {

  /**
   * 默认材质类型
   */
  static DEFAULT_MATERIAL_TYPE =  FcbMaterialType.COMMON

  static builders = new Map([
    [FcbMaterialType.COMMON, new CommonMaterialBuilder()],
    [FcbMaterialType.GLASS, new GlassMaterialBuilder()],
  ])

  /**
   * 生成的不同的材质缓存
   */
  static cache = new Map()

  /**
   * @typedef {Object} MaterialParams
   * @property {THREE.Texture} [texture]
   * @property {THREE.Color} [extraColor] 叠加色
   * @property {number} [aplha] 0-255
   * @property {THREE.Color} [plantsColor] 植物叠加色
   */

  /**
   * 创建材质（带缓存）
   * @param {string} type
   * @param {MaterialParams} params 包含texture extraColor aplha plantsColor
   */
  static create(type, params) {

    const key = this._getCacheKey(type, params)

    if (this.cache.has(key)) {
      return this.cache.get(key)
    }

    const builder = this.builders.get(type)

    if (!builder) {
      console.warn(`Unknown material type: ${type}`)
      return null
    }

    const material = builder.build(params)

    const info = FcbTransfer.getBlockDetail(params.nameStr)
    //这个颜色是方块自身属性，并非extraColor
    const blockColor = new Color(info.red / 255, info.green / 255, info.blue / 255).convertSRGBToLinear()
    material.color = material.color.multiply(blockColor)

    this.cache.set(key, material)

    return material
  }

  /**
   * 生成缓存 key
   */
  static _getCacheKey(type, params) {

    const plantsColor = params.plantsColor ?? ''
    const key = `${type}_${params.nameStr}_${params.extraColorInt}_${plantsColor}`

    return key
  }

  /**
   * 手动注册材质
   */
  static register(type, builder) {
    this.builders.set(type, builder)
  }

  /**
   * 清空缓存
   */
  static clearCache() {
    this.cache.forEach(mat => mat.dispose?.())
    this.cache.clear()
  }

}
