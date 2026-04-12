export class BoxMappingUtil {

  static apply(material, options = {}) {

    if (material.userData.boxMapping) return
    material.userData.boxMapping = true

    const {
      scale = 1.0,
      useFract = true
    } = options

    material.defines = material.defines || {}
    material.defines.USE_MAP = ''

    material.onBeforeCompile = (shader) => {

      // ===== uniforms =====
      shader.uniforms.boxScale = { value: scale }
      shader.uniforms.boxUseFract = { value: useFract ? 1 : 0 }

      // ===== vertex =====
      shader.vertexShader =
        `
        varying vec3 vWorldPos;
        varying vec3 vWorldNormal;
        ` + shader.vertexShader

      shader.vertexShader = shader.vertexShader.replace(
        /void\s+main\s*\(\)\s*{/,
        match => match + `
          vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
          vWorldNormal = normalize(mat3(modelMatrix) * normal);
        `
      )

      // ===== fragment =====
      shader.fragmentShader =
        `
        uniform float boxScale;
        uniform int boxUseFract;

        varying vec3 vWorldPos;
        varying vec3 vWorldNormal;
        ` + shader.fragmentShader

      // ===== 核心替换 =====
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <map_fragment>',
        `
        #ifdef USE_MAP

          vec3 p = vWorldPos * boxScale;

          if (boxUseFract == 1) {
            p = fract(p);
          }

          vec3 nx  = normalize(vWorldNormal);
          vec3 an = abs(nx);

          vec2 uv;
          vec4 tex;

          // ===== 6方向选择 =====
          if (an.x >= an.y && an.x >= an.z) {

            if (nx.x > 0.0) {
              uv = vec2(-p.z, p.y); // +X
            } else {
              uv = vec2(p.z, p.y); // -X
            }

          } else if (an.y > an.z) {

            if (nx.y > 0.0) {
              uv = vec2(p.x, -p.z);  // +Y
            } else {
              uv = vec2(p.x, p.z);  // -Y
            }

          } else {

            if (nx.z > 0.0) {
              uv = vec2(p.x, p.y);  // +Z
            } else {
              uv = vec2(-p.x, p.y); // -Z
            }

          }

          tex = texture2D(map, uv);

          diffuseColor *= tex;

        #endif
        `
      )
    }

    material.needsUpdate = true
  }
}
