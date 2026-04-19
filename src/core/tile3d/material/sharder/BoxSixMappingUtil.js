import * as THREE from 'three'

export class BoxSixMappingUtil {

  /**
   * @typedef {Object} BoxSixMappingOptions
   *
   * ===== 基础 =====
   * @property {number} [scale=1]
   * @property {boolean} [useFract=true]
   *
   * ===== MC 旋转 =====
   * @property {number} [x=0]   // blockstate x
   * @property {number} [y=0]   // blockstate y
   * @property {'x'|'y'|'z'} [axis] 
   *
   * ===== 六面贴图 =====
   * @property {THREE.Texture} [mapPX]
   * @property {THREE.Texture} [mapNX]
   * @property {THREE.Texture} [mapPY]
   * @property {THREE.Texture} [mapNY]
   * @property {THREE.Texture} [mapPZ]
   * @property {THREE.Texture} [mapNZ]
   *
   * ===== MC 快捷 =====
   * @property {THREE.Texture} [top]
   * @property {THREE.Texture} [bottom]
   * @property {THREE.Texture} [side]
   * @property {THREE.Texture} [end]
   *
   * ===== 面旋转（优先级最高）=====
   * @property {number} [rotPX=0]
   * @property {number} [rotNX=0]
   * @property {number} [rotPY=0]
   * @property {number} [rotNY=0]
   * @property {number} [rotPZ=0]
   * @property {number} [rotNZ=0]
   */

  static apply(material, options = {}) {

    if (!material || material.userData?.boxSixMapping) return

    material.userData = material.userData || {}
    material.userData.boxSixMapping = true

    const {
      scale = 1,
      useFract = true,

      x = 0,
      y = 0,
      axis = 'y',

      mapPX, mapNX, mapPY, mapNY, mapPZ, mapNZ,
      top, bottom, side, end,

      rotPX = 0, rotNX = 0,
      rotPY = 0, rotNY = 0,
      rotPZ = 0, rotNZ = 0,

      map = material.map || null
    } = options

    // ===== 贴图补全 =====
    const texPX = mapPX || side || map
    const texNX = mapNX || side || map
    const texPZ = mapPZ || side || map
    const texNZ = mapNZ || side || map

    const texPY = mapPY || top || end || map
    const texNY = mapNY || bottom || end || map

    // ===== axis → 基础旋转 =====
    let axisRotX = 0
    let axisRotY = 0

    if (axis === 'x') {
      axisRotZ = 90
    } else if (axis === 'z') {
      axisRotX = 90
    }

    // ===== 合成旋转 =====
    const final = {
      PX: rotPX + x + axisRotX,
      NX: rotNX + x + axisRotX,

      PY: rotPY + y + axisRotY,
      NY: rotNY + y + axisRotY,

      PZ: rotPZ + x + axisRotX,
      NZ: rotNZ + x + axisRotX
    }

    material.defines = material.defines || {}
    material.defines.USE_MAP = ''

    material.onBeforeCompile = (shader) => {

      shader.uniforms.boxScale = { value: scale }
      shader.uniforms.boxUseFract = { value: useFract ? 1 : 0 }

      shader.uniforms.mapPX = { value: texPX }
      shader.uniforms.mapNX = { value: texNX }
      shader.uniforms.mapPY = { value: texPY }
      shader.uniforms.mapNY = { value: texNY }
      shader.uniforms.mapPZ = { value: texPZ }
      shader.uniforms.mapNZ = { value: texNZ }

      shader.uniforms.rotPX = { value: final.PX }
      shader.uniforms.rotNX = { value: final.NX }
      shader.uniforms.rotPY = { value: final.PY }
      shader.uniforms.rotNY = { value: final.NY }
      shader.uniforms.rotPZ = { value: final.PZ }
      shader.uniforms.rotNZ = { value: final.NZ }

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
        #ifdef USE_MAP

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

        #endif
        `
      )
    }

    material.needsUpdate = true
  }
}