import * as THREE from 'three'
import { TextureSet } from '../../texture/texset/TextureSet.js'
export class BoxSixMappingUtil {

  /**
   * 
   * 空间坐标映射纹理材质
   * 
   * @param {THREE.Material} material
   * @param {TextureSet} textureSet 
   * @param {object} options 
   * @returns {THREE.Material} 材质对象
   */
  static apply(material, textureSet, options = {}) {

    if (!material || material.userData?.boxSixMapping) return

    material.userData = material.userData || {}
    material.userData.boxSixMapping = true

    const {
      scale = 1,
      useFract = true,
    } = options

    material.onBeforeCompile = (shader) => {

      shader.uniforms.boxScale = { value: scale }
      shader.uniforms.boxUseFract = { value: useFract ? 1 : 0 }

      textureSet.toUniforms(shader)

      shader.vertexShader = `
        varying vec3 vWorldPos;
        varying vec3 vWorldNormal;
      ` + shader.vertexShader

      shader.vertexShader = shader.vertexShader.replace(
        'void main() {',
        `
        void main() {
          vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
          vWorldNormal = normalize(mat3(modelMatrix) * normal);
        `
      )

      shader.fragmentShader = `
        uniform float boxScale;
        uniform int boxUseFract;

        uniform sampler2D mapPX;
        uniform sampler2D mapNX;
        uniform sampler2D mapPY;
        uniform sampler2D mapNY;
        uniform sampler2D mapPZ;
        uniform sampler2D mapNZ;

        uniform float rotPX;
        uniform float rotNX;
        uniform float rotPY;
        uniform float rotNY;
        uniform float rotPZ;
        uniform float rotNZ;

        varying vec3 vWorldPos;
        varying vec3 vWorldNormal;

        vec2 rotateUV(vec2 uv, float deg) {
          float rad = radians(deg);
          float s = sin(rad);
          float c = cos(rad);

          uv -= 0.5;
          uv = mat2(c, -s, s, c) * uv;
          uv += 0.5;

          return uv;
        }
      ` + shader.fragmentShader


      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <map_fragment>',
        `
          vec3 p = vWorldPos * boxScale;

          if (boxUseFract == 1) p = fract(p);

          vec3 n = normalize(vWorldNormal);
          vec3 an = abs(n);

          vec2 uv;
          vec4 tex;

          if (an.x >= an.y && an.x >= an.z) {
            if (n.x > 0.0) {
              uv = rotateUV(vec2(-p.z, p.y), rotPX);
              tex = texture2D(mapPX, uv);
            } else {
              uv = rotateUV(vec2(p.z, p.y), rotNX);
              tex = texture2D(mapNX, uv);
            }
          } else if (an.y > an.z) {
            if (n.y > 0.0) {
              uv = rotateUV(vec2(p.x, -p.z), rotPY);
              tex = texture2D(mapPY, uv);
            } else {
              uv = rotateUV(vec2(p.x, p.z), rotNY);
              tex = texture2D(mapNY, uv);
            }
          } else {
            if (n.z > 0.0) {
              uv = rotateUV(vec2(p.x, p.y), rotPZ);
              tex = texture2D(mapPZ, uv);
            } else {
              uv = rotateUV(vec2(-p.x, p.y), rotNZ);
              tex = texture2D(mapNZ, uv);
            }
          }

          diffuseColor *= tex;
        `
      )
    }

    material.needsUpdate = true

    return material
  }

  /**
   * 从纹理集生成 6 个面的纹理数组
   * 
   * @param {THREE.Material} baseMaterial 基础材质（模板，会克隆其属性）
   * @param {TextureSet} textureSet 纹理集
   * @param {object} options 配置项
   * @returns {THREE.Material[]} 6 个材质的数组
   */
  static apply2(baseMaterial, textureSet) {
  if (!textureSet.isMultiple()) return [baseMaterial]

    const { px, nx, py, ny, pz, nz } = textureSet.faces
    
    const applyTexture = (material, face) => {
      if (!face.map) return material
      
      const texture = face.rot !== 0 ? face.map.clone() : face.map
      
      if (face.rot !== 0) {
        texture.rotation = (face.rot * Math.PI) / 180
        texture.center.set(0.5, 0.5)
      }
      
      material.map = texture
      return material
    }
    
    return [
      applyTexture(baseMaterial.clone(), px),
      applyTexture(baseMaterial.clone(), nx),
      applyTexture(baseMaterial.clone(), py),
      applyTexture(baseMaterial.clone(), ny),
      applyTexture(baseMaterial.clone(), pz),
      applyTexture(baseMaterial.clone(), nz)
    ]
  }

}