import { MeshStandardMaterial, Color } from "../../Three.js"
import { IMaterialBuilder } from "./IMaterialBuilder.js"

/**
 * 生成 THREE.MeshStandardMaterial 液体材质
 */
export class WaterMaterialBuilder extends IMaterialBuilder{

   /**
   * @typedef {Object} MaterialParams
   * @property {THREE.Texture} [texture]
   * @property {THREE.Color} [extraColor] 叠加色
   * @property {number} [aplha] 0-1
   */

  /**
   * 液体 材质
   * @param {MaterialParams} params
   * @returns {THREE.MeshStandardMaterial}
   */
  build({texture, extraColor, alpha}) {

    const normalizedAlpha = alpha !== undefined ? alpha : 1
    const useAlpha = normalizedAlpha < 1

    return new MeshStandardMaterial({
      map: texture,
      color: extraColor ?? new Color(1,1,1),
      transparent: true,      // 水 半透明
      opacity: (0.6 * normalizedAlpha),           // 控制透光度
      roughness: 0.05,
      metalness: 0.0,
      depthWrite: false       // 防止透明排序遮挡
    })
  }
}
