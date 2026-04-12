import { FaceFlipUtil } from "./util/FaceFlipUtil.js"

/**
 * TransformableBox 平面对角线 翻转 flip工具
 */
export class BoxFlipUtil{

    /**
     * 根据 ruleTable 将对角线翻转 flipped diagonal 应用到 BoxGeometry
     * @param {THREE.BoxGeometry} geo
     * @param {object[]} rulerTable
     * @returns
     */
    static applyFlip(geo, rulerTable) {

      const indexAttr = geo.getIndex()
      if (!indexAttr) return

      const index = indexAttr.array

      //rulerTable顺序['E','W','S','N','U','D'] 2 - 7

      //three box 顺序[+X -X  +Y -Y  +Z -Z] 0 - 5
      const FACE_RULE_BITS = [
        2, // +X -> E
        3, // -X -> W
        6, // +Y -> U
        7, // -Y -> D
        4, // +Z -> S
        5  // -Z -> N
      ]

      for (let face = 0; face < 6; face++) {

        const bit = FACE_RULE_BITS[face]
        const rule = rulerTable[bit]

        if (rule.sign !== 1) continue

        const name = ['E','W','U','D','S','N'][face]

        FaceFlipUtil.flip(index, name)
      }

      indexAttr.needsUpdate = true
    }

}
