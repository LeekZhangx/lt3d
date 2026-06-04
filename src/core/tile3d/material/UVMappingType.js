/**
 * 纹理映射材质类型枚举
 * @enum {string}
 */
export const UVMappingType = Object.freeze({
  /** UV映射 - 使用模型UV坐标 */
  UV: 'uv',
  /** 世界空间投影 */
  WORLD_PROJECTION: 'worldProjection',
  /** 三平面映射 */
  TRIPLANAR: 'triplanar',
  /** Texture Atlas 六面映射 - 将6面纹理打包为图集，shader 注入世界投影 */
  ATLAS: 'atlas',
})