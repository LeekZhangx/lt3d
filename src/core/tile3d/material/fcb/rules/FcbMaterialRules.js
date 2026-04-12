import { FcbMaterialType } from "../FcbMaterialType";

/**
 * Fcb 材质类别 与 对应的MaterialType
 */
export const FcbMaterialRules = [

  {
    match: (ctx) => ctx.isGlass,
    type: FcbMaterialType.GLASS
  },

]
