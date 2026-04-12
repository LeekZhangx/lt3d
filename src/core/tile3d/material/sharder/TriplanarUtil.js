/**
 * Triplanar 是一种通过在世界空间中投影来生成 UV 并对纹理进行采样的方法。
 *
 * 输入纹理被采样 3 次，在世界 x、y 和 z 轴的每一个轴中都采样一次，然后生成的信息被平面投影到模型上。
 */
export class TriplanarUtil {

  static apply(material, options = {}) {

    if (material.userData.triplanar) return
    material.userData.triplanar = true

    const {
      scale = 1.0,
      sharpness = 4.0,
      useFract = true
    } = options

    material.defines = material.defines || {}
    material.defines.USE_MAP = ''

    material.onBeforeCompile = (shader) => {

      // ===== uniforms =====
      shader.uniforms.triplanarScale = { value: scale }
      shader.uniforms.triplanarSharpness = { value: sharpness }
      shader.uniforms.triplanarUseFract = { value: useFract ? 1 : 0 }

      // ===== vertex：直接加在最前面 =====
      shader.vertexShader =
        `
        varying vec3 vWorldPos;
        varying vec3 vWorldNormal;
        ` + shader.vertexShader

      // 👉 在 main 末尾插入（不会冲突）
      shader.vertexShader = shader.vertexShader.replace(
        /void\s+main\s*\(\)\s*{/,
        match => match + `
          vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
          vWorldNormal = normalize(mat3(modelMatrix) * normal);
        `
      )

      // ===== fragment：变量 + uniform =====
      shader.fragmentShader =
        `
        uniform float triplanarScale;
        uniform float triplanarSharpness;
        uniform int triplanarUseFract;

        varying vec3 vWorldPos;
        varying vec3 vWorldNormal;
        ` + shader.fragmentShader

      // ===== 替换 map_fragment（唯一 replace）=====
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <map_fragment>',
        `
        #ifdef USE_MAP

          vec3 blend = abs(normalize(vWorldNormal));
          blend = pow(blend, vec3(triplanarSharpness));
          blend /= (blend.x + blend.y + blend.z);

          vec3 p = vWorldPos * triplanarScale;

          if (triplanarUseFract == 1) {
            p = fract(p);
          }

          // ===== UV 计算 =====

          // X
          vec2 uvX = vec2(p.z, -p.y);
          uvX.x *= sign(vWorldNormal.x);

          // Y
          vec2 uvY = vec2(p.x, p.z);
          uvY.y *= sign(vWorldNormal.y);

          // Z
          vec2 uvZ = vec2(p.x, -p.y);
          uvZ.x *= sign(vWorldNormal.z);


          // ===== 采样 =====
          vec4 xTex = texture2D(map, uvX);
          vec4 yTex = texture2D(map, uvY);
          vec4 zTex = texture2D(map, uvZ);

          vec4 tex =
              xTex * blend.x +
              yTex * blend.y +
              zTex * blend.z;


          diffuseColor *= tex;

        #endif
        `
      )
    }

    material.needsUpdate = true
  }
}
