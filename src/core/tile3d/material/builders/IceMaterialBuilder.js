import { MeshPhysicalMaterial, Color } from "../../Three.js"
import { IMaterialBuilder } from "./IMaterialBuilder.js"

/**
 * 生成 THREE.MeshPhysicalMaterial 冰块 材质
 */
export class IceMaterialBuilder extends IMaterialBuilder{

  /**
   * @typedef {Object} MaterialParams
   * @property {THREE.Texture} [texture]
   * @property {THREE.Color} [extraColor] 叠加色
   * @property {number} [alpha] 0-1
   */

  /**
   * Ice 材质
   * @param {MaterialParams} params
   * @returns {THREE.MeshStandardMaterial}
   */
  build({texture, extraColor, alpha}) {

    const normalizedAlpha = alpha !== undefined ? alpha : 1
    const useAlpha = normalizedAlpha < 1

    return new MeshPhysicalMaterial({
      map: texture,
      color: extraColor ?? new THREE.Color(1,1,1),
      transmission: 1.0,      // 透射介质
      transparent: useAlpha,     // 不走透明管线
      opacity: normalizedAlpha,
      roughness: 0.25,        // 冰比玻璃更“雾”
      metalness: 0.0,
      ior: 1.31,              // 接近真实冰
      thickness: 0.2,         // 冰块体积感
      attenuationDistance: 0.5,
      attenuationColor: new Color(0.8, 0.9, 1.0).convertSRGBToLinear(),
      clearcoat: 0.0
    })
  }
}
