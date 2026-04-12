import { MaterialType } from "../MaterialType";

/**
 * 材质类别 与 对应的MaterialType
 */
export const MaterialRules = [
  {
    match: (ctx) => ctx.isWater,
    type: MaterialType.WATER
  },
  {
    match: (ctx) => ctx.isGlass,
    type: MaterialType.GLASS
  },
  {
    match: (ctx) => ctx.isIce,
    type: MaterialType.ICE
  },
  {
    match: (ctx) => ctx.isLeavesOrGrass,
    type: MaterialType.LEAVES
  },
]
