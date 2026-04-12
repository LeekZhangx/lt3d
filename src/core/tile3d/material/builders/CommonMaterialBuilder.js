import { MeshStandardMaterial, Color } from "../../Three"
import { IMaterialBuilder } from "./IMaterialBuilder"

/**
 * 生成 THREE.MeshStandardMaterial 普通不透明 材质
 */
export class CommonMaterialBuilder extends IMaterialBuilder{

  /**
   * @typedef {Object} MaterialParams
   * @property {THREE.Texture} [texture]
   * @property {THREE.Color} [extraColor] 叠加色
   * @property {number} [aplha] 0-1
   */

  /**
   * 普通不透明材质
   * @param {MaterialParams} params
   * @returns {THREE.MeshStandardMaterial}
   */
  build({texture, extraColor, alpha}) {

    const normalizedAlpha = alpha !== undefined ? alpha : 1
    const useAlpha = normalizedAlpha < 1

    return new MeshStandardMaterial({
      map: texture,
      color: extraColor ?? new Color(1,1,1),
      transparent: useAlpha,
      opacity: normalizedAlpha
    })
  }

}
