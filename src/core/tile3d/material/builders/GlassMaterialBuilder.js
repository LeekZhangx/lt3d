import { MeshPhysicalMaterial, Color } from "../../Three"
import { IMaterialBuilder } from "./IMaterialBuilder"

/**
 * 生成 THREE.MeshPhysicalMaterial 玻璃 材质
 */
export class GlassMaterialBuilder extends IMaterialBuilder{

  /**
   * @typedef {Object} MaterialParams
   * @property {THREE.Texture} [texture]
   * @property {THREE.Color} [extraColor] 叠加色
   * @property {number} [aplha] 0-1
   */

  /**
   * 玻璃材质, 不使用 Multiply、不使用透明混合
   * @param {MaterialParams} params
   * @returns {THREE.MeshStandardMaterial}
   */
  build({texture, extraColor, alpha}) {

    const normalizedAlpha = alpha !== undefined ? alpha : 1
    const useAlpha = normalizedAlpha < 1

    const material = new MeshPhysicalMaterial({
      map: texture,
      color: extraColor ?? new Color(1,1,1),
      transmission: 1.0,
      transparent: useAlpha,
      opacity: normalizedAlpha,
      metalness: 0.0,
      roughness: 0.0,
      ior: 1.5,
      thickness: 0.1,
      clearcoat: 1.0,
      clearcoatRoughness: 0.0
    })

    // 染色玻璃：用物理方式
    if (extraColor != null) {
      material.color.copy(extraColor)
      material.attenuationColor.copy(extraColor)
    }

    return material
  }

}
