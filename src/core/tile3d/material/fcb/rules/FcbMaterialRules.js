import { FcbMaterialType } from "../FcbMaterialType.js";

/**
 * Fcb 材质类别 与 对应的MaterialType
 */
export const FcbMaterialRules = [

  {
    match: (ctx) => ctx.isGlass,
    type: FcbMaterialType.GLASS
  },

]
