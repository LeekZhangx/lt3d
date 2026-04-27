import { MaterialType } from "../MaterialType.js";

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
    match: (ctx) => ctx.isLeaves,
    type: MaterialType.LEAVES
  },
    {
    match: (ctx) => ctx.isGrass,
    type: MaterialType.GRASS
  },
]
