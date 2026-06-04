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
          vWorldNormal = normalize(mat3(transpose(inverse(modelMatrix))) * normal);
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
   * 六面世界空间投影
   *
   * 特性：
   * - 六方向独立贴图
   * - 六方向独立旋转
   * - 世界空间投影
   * - Triplanar Blending（无接缝）
   * - 基于 onBeforeCompile
   * - 保留 MeshStandardMaterial PBR
   *
   * @param {THREE.Material} material
   * @param {TextureSet} textureSet
   * @param {Object} options
   * @param {number} options.scale
   * @param {boolean} options.useFract
   * @param {number} options.blendSharpness
   *
   * @returns {THREE.Material}
   */
  static apply3(material, textureSet, options = {}) {

    if (!material) return material

    if (material.userData?.boxSixMapping)
      return material

    material.userData = {
      ...material.userData,
      boxSixMapping: true
    }

    const {
      scale = 1,
      useFract = true,

      // 越大边缘越锐利
      // 2~8 推荐
      blendSharpness = 4,
    } = options

    material.onBeforeCompile = (shader) => {

      // =========================
      // uniforms
      // =========================

      shader.uniforms.boxScale = {
        value: scale
      }

      shader.uniforms.boxUseFract = {
        value: useFract ? 1 : 0
      }

      shader.uniforms.boxBlendSharpness = {
        value: blendSharpness
      }

      // 注入贴图
      textureSet.toUniforms(shader)

      // =========================
      // vertex
      // =========================

      shader.vertexShader = /* glsl */`

        varying vec3 vWorldPos;
        varying vec3 vWorldNormal;

      ` + shader.vertexShader

      shader.vertexShader =
        shader.vertexShader.replace(

          'void main() {',

          /* glsl */`

          void main() {

            vWorldPos =
              (modelMatrix * vec4(position, 1.0)).xyz;

            // 世界空间法线
            vWorldNormal =
              normalize(
                mat3(transpose(inverse(modelMatrix))) * normal
              );

          `
        )

      // =========================
      // fragment header
      // =========================

      shader.fragmentShader = /* glsl */`

        uniform float boxScale;
        uniform int boxUseFract;

        uniform float boxBlendSharpness;

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

        // =========================
        // UV rotation
        // =========================

        vec2 rotateUV(vec2 uv, float deg) {

          float r = radians(deg);

          float s = sin(r);
          float c = cos(r);

          uv -= 0.5;

          uv =
            mat2(
              c, -s,
              s,  c
            ) * uv;

          uv += 0.5;

          return uv;
        }

      ` + shader.fragmentShader

      // =========================
      // map_fragment replacement
      // =========================

      shader.fragmentShader =
        shader.fragmentShader.replace(

          '#include <map_fragment>',

          /* glsl */`

          vec3 p =
            vWorldPos * boxScale;

          // =========================
          // repeat
          // =========================

          if (boxUseFract == 1) {

            p = fract(p);
          }

          // =========================
          // world normal
          // =========================

          vec3 n =
            normalize(vWorldNormal);

          // =========================
          // blend weights
          // =========================

          vec3 blend = abs(n);

          // 控制边缘锐度
          blend = pow(
            blend,
            vec3(boxBlendSharpness)
          );

          blend /= (
            blend.x +
            blend.y +
            blend.z
          );

          // =========================
          // UVs
          // =========================

          vec2 uvPX =
            rotateUV(
              vec2(
                1.0 - p.z,
                p.y
              ),
              rotPX
            );

          vec2 uvNX =
            rotateUV(
              vec2(
                p.z,
                p.y
              ),
              rotNX
            );

          vec2 uvPY =
            rotateUV(
              vec2(
                p.x,
                1.0 - p.z
              ),
              rotPY
            );

          vec2 uvNY =
            rotateUV(
              vec2(
                p.x,
                p.z
              ),
              rotNY
            );

          vec2 uvPZ =
            rotateUV(
              vec2(
                p.x,
                p.y
              ),
              rotPZ
            );

          vec2 uvNZ =
            rotateUV(
              vec2(
                1.0 - p.x,
                p.y
              ),
              rotNZ
            );

          // =========================
          // sample textures
          // =========================

          vec4 texX =
            n.x > 0.0
              ? texture2D(mapPX, uvPX)
              : texture2D(mapNX, uvNX);

          vec4 texY =
            n.y > 0.0
              ? texture2D(mapPY, uvPY)
              : texture2D(mapNY, uvNY);

          vec4 texZ =
            n.z > 0.0
              ? texture2D(mapPZ, uvPZ)
              : texture2D(mapNZ, uvNZ);

          // =========================
          // triplanar blend
          // =========================

          vec4 tex =
              texX * blend.x +
              texY * blend.y +
              texZ * blend.z;

          diffuseColor *= tex;

          `
        )
    }

    material.needsUpdate = true

    // =========================
    // texture setup
    // =========================

    this._setupTexture(textureSet.px?.map)
    this._setupTexture(textureSet.nx?.map)

    this._setupTexture(textureSet.py?.map)
    this._setupTexture(textureSet.ny?.map)

    this._setupTexture(textureSet.pz?.map)
    this._setupTexture(textureSet.nz?.map)

    return material
  }

  /**
   * 自动初始化贴图
   *
   * @param {THREE.Texture} tex
   */
  static _setupTexture(tex) {

    if (!tex) return

    tex.wrapS = THREE.RepeatWrapping
    tex.wrapT = THREE.RepeatWrapping

    tex.colorSpace =
      THREE.SRGBColorSpace

    tex.needsUpdate = true
  }

}