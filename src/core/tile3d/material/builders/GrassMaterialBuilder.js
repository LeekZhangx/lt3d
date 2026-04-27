import { MeshStandardMaterial, Color } from "../../Three.js"
import { IMaterialBuilder } from "./IMaterialBuilder.js"

/**
 * 生成 THREE.MeshStandardMaterial 草地材质
 */
export class GrassMaterialBuilder extends IMaterialBuilder{

  /**
   * @typedef {Object} MaterialParams
   * @property {THREE.Texture} [texture]
   * @property {THREE.Color} [extraColor] 叠加色
   * @property {THREE.Color} [plantsColor] 植物叠加色
   * @property {number} [aplha] 0-1
   */

  /**
   * 草地材质
   * @param {MaterialParams} params
   * @returns {THREE.MeshStandardMaterial}
   */
  build({texture, extraColor, plantsColor, alpha}) {

    //默认植物叠加色
    let baseColor = plantsColor ?? new Color(170/255, 250/255, 164/255).convertSRGBToLinear()

    if(extraColor){
      baseColor.multiply(extraColor)
    }

    const normalizedAlpha = alpha !== undefined ? alpha : 1
    const useAlpha = normalizedAlpha < 1

    return new MeshStandardMaterial({
      map: texture,
      color: baseColor ?? new Color(1,1,1),
      transparent: useAlpha,
      opacity: normalizedAlpha
    })
  }

}
