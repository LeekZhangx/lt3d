import { MaterialRules } from '../rules/MaterialRules'
import { FcbMaterialRules } from '../fcb/rules/FcbMaterialRules'
import { FcbMaterialFactory } from '../fcb/FcbMaterialFactory'
import { MaterialFactory } from './MaterialFactory'

/**
 * 材质规则处理，根据材质判断对象的结果，给出对应的材质类型
 * - 特殊的mod有其对应的材质类型结果
 */
export class MaterialResolver {

  /**
   * @typedef {object} ctx
   * @property {boolean} [isWater]
   * @property {boolean} [isIce]
   * @property {boolean} [isGlass]
   * @property {boolean} [isLeavesOrGrass]
   */

  /**
   * 根据材质判断对象，返回对应的材质种类
   * - 对于没有命中的类型，会赋予工厂的 默认材质类型 DEFAULT_MATERIAL_TYPE
   * @param {ctx} ctx 材质判断结果对象
   * @param {*} factory MaterialFactory 材质工厂
   * @returns {string}
   */
  static resolve(ctx, factory) {

    // fcb 材质
    if (factory === FcbMaterialFactory) {

      for (const rule of FcbMaterialRules) {
        if (rule.match(ctx)) return rule.type
      }

      return factory.DEFAULT_MATERIAL_TYPE

    } else if (factory === MaterialFactory){

      // 默认材质
      for (const rule of MaterialRules) {
        if (rule.match(ctx)) return rule.type
      }

      return factory.DEFAULT_MATERIAL_TYPE

    }

    return factory.DEFAULT_MATERIAL_TYPE
  }
}
