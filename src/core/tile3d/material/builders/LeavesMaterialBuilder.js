import { MeshStandardMaterial, Color } from "../../Three.js"
import { IMaterialBuilder } from "./IMaterialBuilder.js"

/**
 * 生成 THREE.MeshStandardMaterial 带挖空透明的树叶类型 材质
 */
export class LeavesMaterialBuilder extends IMaterialBuilder{

  /**
   * @typedef {Object} MaterialParams
   * @property {THREE.Texture} [texture]
   * @property {THREE.Color} [extraColor] 叠加色
   * @property {number} [aplha] 0-1
   * @property {THREE.Color} [plantsColor] 植物叠加色
   */

  /**
   * 树叶/草 Cutout 材质 挖孔透明，
   * 并赋予叠加色 170/255, 250/255, 164/255
   * @param {MaterialParams} params
   * @returns {THREE.MeshStandardMaterial}
   */
  build({texture,extraColor, alpha, plantsColor}) {
    //默认植物叠加色
    let baseColor = plantsColor ?? new Color(170/255, 250/255, 164/255).convertSRGBToLinear()

    if(extraColor){
      baseColor.multiply(extraColor)
    }

    const normalizedAlpha = alpha !== undefined ? alpha : 1

    return new MeshStandardMaterial({
      map: texture,
      color: baseColor,
      transparent: false, // 不进透明队列
      alphaTest: 0.1,      // 低于阈值直接 discard
      opacity: 0.8 * normalizedAlpha,
      depthWrite: false
    })
  }
}
