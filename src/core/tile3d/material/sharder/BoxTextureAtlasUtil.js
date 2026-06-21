import * as THREE from 'three'

/**
 * ============================================================
 * BoxTextureAtlasUtil  — Canvas 图集 + 逐像素空间投影 shader
 *
 * MULTIPLE: 将 6 面纹理烘焙为 Canvas 图集，通过 applyShaderToMaterial()
 *           注入片段着色器，在 GPU 中逐像素做 fract(worldPos) → 面 UV
 *           → atlas tile 映射，避免顶点 UV 插值带来的回绕/拉伸。
 * SINGLE:   直接使用原纹理，无 shader 注入。
 *
 * Atlas 布局（4 列 x 2 行，col 3 空闲）：
 *   | PX | PY | PZ |   |
 *   | NX | NY | NZ |   |
 *
 * 异步处理：
 * - 首次 buildAtlas() 绘制时纹理可能仍是 fallback
 * - createAtlas() 返回 atlas 纹理后，会轮询各面纹理是否已加载
 * - 全部加载后自动重建 atlas canvas 并更新 atlas.image
 * ============================================================
 */
export class BoxTextureAtlasUtil {

  static DEFAULT_TILE_SIZE = 16
  static DEFAULT_PADDING = 1
  static ATLAS_COLS = 4
  static ATLAS_ROWS = 2

  /** 面 → atlas 图块位置（4×2，col 3 空闲） */
  static FACE_TILES = {
    px: { col: 0, row: 0 },
    py: { col: 1, row: 0 },
    pz: { col: 2, row: 0 },
    nx: { col: 0, row: 1 },
    ny: { col: 1, row: 1 },
    nz: { col: 2, row: 1 },
  }

  /**
   * 从 TextureSet 中获取实际纹理尺寸（取第一个已加载图片的 naturalWidth）
   */
  static _detectTileSize(textureSet) {
    if (!textureSet.isMultiple()) return 0
    const faces = textureSet.faces
    for (const name of ['px','nx','py','ny','pz','nz']) {
      const img = faces[name]?.map?.image
      if (img && img.naturalWidth > 0) return img.naturalWidth
    }
    return 0
  }

  /* ================= 主入口 ================= */

  /**
   * 为 MULTIPLE 纹理集创建 atlas，并轮询异步重建
   *
   * @param {import('../../texture/texset/TextureSet.js').TextureSet} textureSet
   * @param {Object} [options]
   * @param {number} [options.tileSize=16]
   * @param {THREE.Material} [options.material] 关联的材质，异步重建时标记 needsUpdate
   * @param {Function} [options.onRebuild] 异步重建完成后触发的回调（渲染更新等）
   * @returns {THREE.CanvasTexture}
   */
  static createAtlas(textureSet, options = {}) {
    const atlas = this.buildAtlas(textureSet, options)

    if (textureSet.isMultiple()) {
      this._rebuildWhenLoaded(textureSet, atlas, options)
    }

    return atlas
  }

  /* ================= Canvas 图集构建 ================= */

  /**
   * 将 TextureSet 的六面纹理烘焙到一张 Canvas
   *
   * @param {import('../../texture/texset/TextureSet.js').TextureSet} textureSet
   * @param {Object} [options]
   * @param {number} [options.tileSize=16]
   * @returns {THREE.CanvasTexture}
   */
  static buildAtlas(textureSet, options = {}) {
    const N = options.tileSize || this._detectTileSize(textureSet) || this.DEFAULT_TILE_SIZE
    const P = options.padding ?? this.DEFAULT_PADDING
    const cols = this.ATLAS_COLS
    const rows = this.ATLAS_ROWS

    const canvas = document.createElement('canvas')
    canvas.width = N * cols + P * (cols + 1)
    canvas.height = N * rows + P * (rows + 1)

    this._drawAtlas(canvas, textureSet, N, P)

    const atlas = new THREE.CanvasTexture(canvas)
    atlas.magFilter = THREE.NearestFilter
    atlas.minFilter = THREE.LinearMipMapLinearFilter
    atlas.wrapS = THREE.RepeatWrapping
    atlas.wrapT = THREE.RepeatWrapping
    atlas.colorSpace = THREE.SRGBColorSpace
    atlas.generateMipmaps = true
    atlas.needsUpdate = true

    return atlas
  }

  /**
   * 在指定 canvas 上绘制图集（含边界扩展）
   */
  static _drawAtlas(canvas, textureSet, N, P) {
    const ctx = canvas.getContext('2d')
    ctx.imageSmoothingEnabled = false
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (textureSet.isSingle()) {
      const img = textureSet.map?.image
      if (img) ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      return
    }
    if (!textureSet.isMultiple()) return

    const faces = textureSet.faces
    const faceMap = { px: faces.px, nx: faces.nx, py: faces.py, ny: faces.ny, pz: faces.pz, nz: faces.nz }
    const step = N + P

    for (const [faceName, tile] of Object.entries(this.FACE_TILES)) {
      const face = faceMap[faceName]
      const img = face?.map?.image
      if (!img) continue

      // tile 内部区域（不含 padding）
      const dx = tile.col * step + P
      const dy = tile.row * step + P

      ctx.save()
      ctx.translate(dx + N / 2, dy + N / 2)
      ctx.rotate((face.rot * Math.PI) / 180)
      ctx.drawImage(img, -N / 2, -N / 2, N, N)
      ctx.restore()

      // 边界扩展：复制边缘 1px 到 padding 区（防 mipmap 渗色）
      if (P > 0) {
        this._extendEdges(ctx, dx, dy, N, P)
      }
    }
  }

  /** 将 N×N 区域边缘像素向外复制 P 像素 */
  static _extendEdges(ctx, dx, dy, N, P) {
    // 上边 → 向上扩展
    const top = ctx.getImageData(dx, dy, N, 1)
    for (let i = 1; i <= P; i++) ctx.putImageData(top, dx, dy - i)
    // 下边
    const bottom = ctx.getImageData(dx, dy + N - 1, N, 1)
    for (let i = 1; i <= P; i++) ctx.putImageData(bottom, dx, dy + N - 1 + i)
    // 左边
    const left = ctx.getImageData(dx, dy, 1, N)
    for (let i = 1; i <= P; i++) ctx.putImageData(left, dx - i, dy)
    // 右边
    const right = ctx.getImageData(dx + N - 1, dy, 1, N)
    for (let i = 1; i <= P; i++) ctx.putImageData(right, dx + N - 1 + i, dy)
    // 四角
    const tl = ctx.getImageData(dx, dy, 1, 1)
    for (let i = 1; i <= P; i++) for (let j = 1; j <= P; j++) ctx.putImageData(tl, dx - i, dy - j)
    const tr = ctx.getImageData(dx + N - 1, dy, 1, 1)
    for (let i = 1; i <= P; i++) for (let j = 1; j <= P; j++) ctx.putImageData(tr, dx + N - 1 + i, dy - j)
    const bl = ctx.getImageData(dx, dy + N - 1, 1, 1)
    for (let i = 1; i <= P; i++) for (let j = 1; j <= P; j++) ctx.putImageData(bl, dx - i, dy + N - 1 + j)
    const br = ctx.getImageData(dx + N - 1, dy + N - 1, 1, 1)
    for (let i = 1; i <= P; i++) for (let j = 1; j <= P; j++) ctx.putImageData(br, dx + N - 1 + i, dy + N - 1 + j)
  }

  /* ================= 异步重建 ================= */

  /**
   * 轮询检测纹理是否加载完毕，全部就绪后重建 atlas
   *
   * 判断依据：
   * - TextureManager 的 fallback 是 HTMLCanvasElement
   * - 真实加载的纹理 image 是 HTMLImageElement
   */
  static _rebuildWhenLoaded(textureSet, atlasTexture, options, intervalMs = 100, maxRetries = 50) {
    if (!textureSet.isMultiple()) return

    const faces = textureSet.faces
    const faceNames = ['px', 'nx', 'py', 'ny', 'pz', 'nz']
    const material = options.material
    let retries = 0

    const check = () => {
      const allLoaded = faceNames.every(name => {
        const img = faces[name]?.map?.image
        return img && img instanceof HTMLImageElement
      })

      if (allLoaded) {
        const N = options.tileSize || this._detectTileSize(textureSet) || this.DEFAULT_TILE_SIZE
        const P = options.padding ?? this.DEFAULT_PADDING
        const cols = this.ATLAS_COLS, rows = this.ATLAS_ROWS
        const cw = N * cols + P * (cols + 1), ch = N * rows + P * (rows + 1)
        const canvas = /** @type {HTMLCanvasElement} */ (atlasTexture.image)
        if (canvas) {
          if (canvas.width !== cw || canvas.height !== ch) { canvas.width = cw; canvas.height = ch }
          this._drawAtlas(canvas, textureSet, N, P)
          atlasTexture.needsUpdate = true
          if (material) material.needsUpdate = true
          if (options.onRebuild) options.onRebuild()
        }
        return
      }

      if (++retries < maxRetries) {
        setTimeout(check, intervalMs)
      }
    }

    setTimeout(check, intervalMs)
  }

  /* ================= Shader 空间投影（替代 UV 烘焙） ================= */

  /**
   * 将 atlas 着色器注入材质，以在片段着色器中做逐像素空间投影。
   *
   * 与 applyUVToGeometry 的顶点 UV 烘焙不同，此方法在 shader 中
   * 计算 fract(worldPos) → 面 UV → atlas tile 坐标，彻底避免
   * 顶点插值带来的边界回绕 / 拉伸问题。
   *
   * @param {THREE.Material} material
   * @param {import('../../texture/texset/TextureSet.js').TextureSet} textureSet
   * @param {Object} [options]
   * @param {number} [options.tileSize=16]
   */
  static applyShaderToMaterial(material, textureSet, options = {}) {
    if (!material || material.userData?.atlasShaderInjected) return
    if (!textureSet.isMultiple()) return

    material.userData = material.userData || {}
    material.userData.atlasShaderInjected = true

    const N = options.tileSize || this._detectTileSize(textureSet) || this.DEFAULT_TILE_SIZE
    const P = options.padding ?? this.DEFAULT_PADDING
    const cols = this.ATLAS_COLS
    const rows = this.ATLAS_ROWS
    const cw = N * cols + P * (cols + 1)
    const ch = N * rows + P * (rows + 1)
    const step = N + P

    const prevOnBeforeCompile = material.onBeforeCompile

    material.onBeforeCompile = (shader) => {

      /* ---- uniforms ---- */
      // atlas 布局参数（片段着色器据此将面 UV 映射到对应 tile）
      shader.uniforms.uAtlasTileSize = { value: N }
      shader.uniforms.uAtlasPadding = { value: P }
      shader.uniforms.uAtlasStep   = { value: step }
      shader.uniforms.uAtlasCW     = { value: cw }
      shader.uniforms.uAtlasCH     = { value: ch }
      // 六面 tile 的 (col, row) 索引，打包为 vec2[6]
      // 顺序：px=0, nx=1, py=2, ny=3, pz=4, nz=5
      const tileIdx = [
        this.FACE_TILES.px.col, this.FACE_TILES.px.row,
        this.FACE_TILES.nx.col, this.FACE_TILES.nx.row,
        this.FACE_TILES.py.col, this.FACE_TILES.py.row,
        this.FACE_TILES.ny.col, this.FACE_TILES.ny.row,
        this.FACE_TILES.pz.col, this.FACE_TILES.pz.row,
        this.FACE_TILES.nz.col, this.FACE_TILES.nz.row,
      ]
      shader.uniforms.uAtlasTiles = { value: tileIdx }

      /* ---- vertex ---- */
      shader.vertexShader = /* glsl */`
        varying vec3 vAtlasWorldPos;
        varying vec3 vAtlasWorldNormal;
      ` + shader.vertexShader

      shader.vertexShader = shader.vertexShader.replace(
        'void main() {',
        /* glsl */`
        void main() {
          vAtlasWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
          vAtlasWorldNormal = normalize(mat3(transpose(inverse(modelMatrix))) * normal);
        `
      )

      /* ---- fragment header ---- */
      shader.fragmentShader = /* glsl */`
        uniform float uAtlasTileSize;
        uniform float uAtlasPadding;
        uniform float uAtlasStep;
        uniform float uAtlasCW;
        uniform float uAtlasCH;
        uniform vec2 uAtlasTiles[6];

        varying vec3 vAtlasWorldPos;
        varying vec3 vAtlasWorldNormal;
      ` + shader.fragmentShader

      /* ---- 替换 map_fragment ---- */
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <map_fragment>',
        /* glsl */`
          vec3 p = vAtlasWorldPos;
          vec3 n = normalize(vAtlasWorldNormal);
          vec3 an = abs(n);

          vec2 faceUV;
          int idx;

          if (an.x >= an.y && an.x >= an.z) {
            if (n.x > 0.0) {
              // +X → PX
              faceUV = vec2(1.0 - fract(p.z), fract(p.y));
              idx = 0;
            } else {
              // -X → NX
              faceUV = vec2(fract(p.z), fract(p.y));
              idx = 1;
            }
          } else if (an.y > an.z) {
            if (n.y > 0.0) {
              // +Y → PY
              faceUV = vec2(fract(p.x), 1.0 - fract(p.z));
              idx = 2;
            } else {
              // -Y → NY
              faceUV = vec2(fract(p.x), fract(p.z));
              idx = 3;
            }
          } else {
            if (n.z > 0.0) {
              // +Z → PZ
              faceUV = vec2(fract(p.x), fract(p.y));
              idx = 4;
            } else {
              // -Z → NZ
              faceUV = vec2(1.0 - fract(p.x), fract(p.y));
              idx = 5;
            }
          }

          // 将 [0,1) 的 faceUV 映射到 atlas 图块
          float step = uAtlasStep;
          float col = uAtlasTiles[idx].x;
          float row = uAtlasTiles[idx].y;

          float au0 = (col * step + uAtlasPadding) / uAtlasCW;
          float au1 = (col * step + uAtlasPadding + uAtlasTileSize) / uAtlasCW;
          // Canvas → GL 的 Y 翻转
          float av0 = 1.0 - (row * step + uAtlasPadding + uAtlasTileSize) / uAtlasCH;
          float av1 = 1.0 - (row * step + uAtlasPadding) / uAtlasCH;

          vec2 atlasUV = vec2(
            au0 + faceUV.x * (au1 - au0),
            av0 + faceUV.y * (av1 - av0)
          );

          vec4 texColor = texture2D(map, atlasUV);
          diffuseColor *= texColor;
        `
      )

      if (prevOnBeforeCompile) prevOnBeforeCompile(shader)
    }

    material.needsUpdate = true
  }

  /* ================= Geometry UV 重映射 ================= */

  // Shader 面公式（与 BoxSixMappingUtil 一致），从顶点世界位置算 UV
  static _SHADER_UV = {
    px: (x,y,z) => ({ pu: z, pv: y, us: -1, vs: 1 }),
    nx: (x,y,z) => ({ pu: z, pv: y, us: 1,  vs: 1 }),
    py: (x,y,z) => ({ pu: x, pv: z, us: 1,  vs: -1 }),
    ny: (x,y,z) => ({ pu: x, pv: z, us: 1,  vs: 1 }),
    pz: (x,y,z) => ({ pu: x, pv: y, us: 1,  vs: 1 }),
    nz: (x,y,z) => ({ pu: x, pv: y, us: -1, vs: 1 }),
  }

  /** 空间投影：shader fract 公式 → 按面位置投射 UV 子区域 → atlas tile */
  static applyUVToGeometry(geometry, textureSet, options = {}) {
    if (!textureSet.isMultiple()) return
    const pos = geometry.getAttribute('position')
    const uv = geometry.getAttribute('uv')
    const index = geometry.getIndex()
    const groups = geometry.groups
    const faceOrder = ['px', 'nx', 'py', 'ny', 'pz', 'nz']
    const N = options.tileSize || this._detectTileSize(textureSet) || this.DEFAULT_TILE_SIZE
    const P = options.padding ?? this.DEFAULT_PADDING
    const step = N + P
    const cw = N * this.ATLAS_COLS + P * (this.ATLAS_COLS + 1)
    const ch = N * this.ATLAS_ROWS + P * (this.ATLAS_ROWS + 1)
    const tileUV = (col, row) => ({
      au0: (col * step + P) / cw,
      au1: (col * step + P + N) / cw,
      av0: 1 - (row * step + P + N) / ch,
      av1: 1 - (row * step + P) / ch,
    })

    const frac = (v) => v - Math.floor(v)

    const doFace = (verts, faceName) => {
      const tile = this.FACE_TILES[faceName]
      if (!tile || verts.length === 0) return
      const { au0, au1, av0, av1 } = tileUV(tile.col, tile.row)
      const uvFn = this._SHADER_UV[faceName]

      let puMin = Infinity, puMax = -Infinity, pvMin = Infinity, pvMax = -Infinity
      for (const vi of verts) {
        const { pu, pv, us, vs } = uvFn(pos.array[vi*3], pos.array[vi*3+1], pos.array[vi*3+2])
        const pvU = pu * us, pvV = pv * vs
        if (pvU < puMin) puMin = pvU; if (pvU > puMax) puMax = pvU
        if (pvV < pvMin) pvMin = pvV; if (pvV > pvMax) pvMax = pvV
      }
      for (const vi of verts) {
        const { pu, pv, us, vs } = uvFn(pos.array[vi*3], pos.array[vi*3+1], pos.array[vi*3+2])
        const pvU = pu * us, pvV = pv * vs
        let uLoc = frac(pvU), vLoc = frac(pvV)
        if (Math.abs(pvU - puMax) < 1e-9 && uLoc < 1e-9) uLoc = 1.0
        if (Math.abs(pvV - pvMax) < 1e-9 && vLoc < 1e-9) vLoc = 1.0
        uv.setXY(vi, au0 + uLoc * (au1 - au0), av0 + vLoc * (av1 - av0))
      }
    }

    /* ========== 路径 A：有 groups ========== */
    if (groups && groups.length > 0) {
      for (let i = 0; i < groups.length; i++) {
        const group = groups[i]
        const visited = new Set()
        const verts = []
        if (index) {
          for (let j = 0; j < group.count; j++) {
            const vi = index.getX(group.start + j)
            if (!visited.has(vi)) { visited.add(vi); verts.push(vi) }
          }
        } else {
          for (let j = 0; j < group.count; j++) {
            const vi = group.start + j
            if (!visited.has(vi)) { visited.add(vi); verts.push(vi) }
          }
        }
        doFace(verts, faceOrder[i % 6])
      }
      uv.needsUpdate = true
      return
    }

    /* ========== 路径 B：无 groups，法线聚类 ========== */
    const normal = geometry.getAttribute('normal')
    if (!normal) return
    const clusters = {}
    for (let vi = 0; vi < pos.count; vi++) {
      const nx = normal.getX(vi), ny = normal.getY(vi), nz = normal.getZ(vi)
      let fn
      if (nx > 0.9) fn = 'px'; else if (nx < -0.9) fn = 'nx'
      else if (ny > 0.9) fn = 'py'; else if (ny < -0.9) fn = 'ny'
      else if (nz > 0.9) fn = 'pz'; else if (nz < -0.9) fn = 'nz'
      else continue
      const pIdx = fn[1] === 'x' ? 0 : (fn[1] === 'y' ? 1 : 2)
      const k = `${fn}:${Math.round(pos.array[vi*3+pIdx]*1e6)/1e6}`
      if (!clusters[k]) clusters[k] = { fn, verts: [] }
      clusters[k].verts.push(vi)
    }
    for (const c of Object.values(clusters)) doFace(c.verts, c.fn)
    uv.needsUpdate = true
  }
}
