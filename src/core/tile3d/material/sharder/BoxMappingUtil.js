export class BoxMappingUtil {

  static apply(material, options = {}) {
  
    if (material.userData.boxMapping) return
    material.userData.boxMapping = true

    const {
      scale = 1.0,
      useFract = true
    } = options

    material.defines = material.defines || {}
    // material.defines.USE_MAP = ''

    material.onBeforeCompile = (shader) => {

      // ===== uniforms =====
      shader.uniforms.boxScale = { value: scale }
      shader.uniforms.boxUseFract = { value: useFract ? 1 : 0 }
      shader.uniforms.boxMap = { value: material.map }

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
        uniform sampler2D boxMap;
        uniform float boxScale;
        uniform int boxUseFract;

        varying vec3 vWorldPos;
        varying vec3 vWorldNormal;
        ` + shader.fragmentShader

      // ===== 核心替换 =====
      // shader.fragmentShader = shader.fragmentShader.replace(
      //   '#include <map_fragment>',
      //   `
      //   #ifdef USE_MAP

      //     vec3 p = vWorldPos * boxScale;

      //     if (boxUseFract == 1) {
      //       p = fract(p);
      //     }

      //     vec3 nx  = normalize(vWorldNormal);
      //     vec3 an = abs(nx);

      //     vec2 uv;
      //     vec4 tex;

      //     // ===== 6方向选择 =====
      //     if (an.x >= an.y && an.x >= an.z) {

      //       if (nx.x > 0.0) {
      //         uv = vec2(-p.z, p.y); // +X
      //       } else {
      //         uv = vec2(p.z, p.y); // -X
      //       }

      //     } else if (an.y > an.z) {

      //       if (nx.y > 0.0) {
      //         uv = vec2(p.x, -p.z);  // +Y
      //       } else {
      //         uv = vec2(p.x, p.z);  // -Y
      //       }

      //     } else {

      //       if (nx.z > 0.0) {
      //         uv = vec2(p.x, p.y);  // +Z
      //       } else {
      //         uv = vec2(-p.x, p.y); // -Z
      //       }

      //     }

      //     tex = texture2D(map, uv);

      //     diffuseColor *= tex;

      //   #endif
      //   `
      // )

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <map_fragment>',
        `
          vec3 p = vWorldPos * boxScale;

          if (boxUseFract == 1) {
            p = fract(p);
          }

          vec3 nx = normalize(vWorldNormal);
          vec3 an = abs(nx);

          vec2 uv;

          if (an.x >= an.y && an.x >= an.z) {
            uv = nx.x > 0.0 ? vec2(-p.z, p.y) : vec2(p.z, p.y);
          } 
          else if (an.y > an.z) {
            uv = nx.y > 0.0 ? vec2(p.x, -p.z) : vec2(p.x, p.z);
          } 
          else {
            uv = nx.z > 0.0 ? vec2(p.x, p.y) : vec2(-p.x, p.y);
          }

          vec4 texColor = texture2D(boxMap, uv);

          diffuseColor *= texColor;
        `
      )
    }

    material.needsUpdate = true
  }
}
