import { MaterialType } from "../MaterialType"
import { GlassMaterialBuilder } from "../builders/GlassMaterialBuilder"
import { IceMaterialBuilder } from "../builders/IceMaterialBuilder"
import { LeavesMaterialBuilder } from "../builders/LeavesMaterialBuilder"
import { CommonMaterialBuilder } from "../builders/CommonMaterialBuilder"
import { WaterMaterialBuilder } from "../builders/WaterMaterialBuilder"

/**
 * 原版mc材质工厂
 */
export class MaterialFactory {

  /**
   * 默认材质类型
   */
  static DEFAULT_MATERIAL_TYPE =  MaterialType.COMMON

  static builders = new Map([
    [MaterialType.COMMON, new CommonMaterialBuilder()],
    [MaterialType.LEAVES, new LeavesMaterialBuilder()],
    [MaterialType.GLASS, new GlassMaterialBuilder()],
    [MaterialType.WATER, new WaterMaterialBuilder()],
    [MaterialType.ICE, new IceMaterialBuilder()]
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
