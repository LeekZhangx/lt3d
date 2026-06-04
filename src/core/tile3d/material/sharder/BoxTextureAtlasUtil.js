import * as THREE from 'three'

/**
 * ============================================================
 * BoxTextureAtlasUtil  — 纯 UV 模式，无 shader 注入
 *
 * MULTIPLE: 将 6 面纹理烘焙为 Canvas 物理图集 + 修改 geometry.uv 指向各图块
 * SINGLE:   直接使用原纹理，geometry.uv 保持不变
 *
 * Atlas 布局（3 列 x 2 行）：
 *   | PX | PY | PZ |
 *   | NX | NY | NZ |
 *
 * 异步处理：
 * - 首次 buildAtlas() 绘制时纹理可能仍是 fallback
 * - createAtlas() 返回 atlas 纹理后，会轮询各面纹理是否已加载（image 变为 HTMLImageElement）
 * - 全部加载后自动重建 atlas canvas 并更新 atlas.image
 * ============================================================
 */
export class BoxTextureAtlasUtil {

  static DEFAULT_TILE_SIZE = 16
  static ATLAS_COLS = 3
  static ATLAS_ROWS = 2

  /** 面 → atlas 图块位置 */
  static FACE_TILES = {
    px: { col: 0, row: 0 },
    py: { col: 1, row: 0 },
    pz: { col: 2, row: 0 },
    nx: { col: 0, row: 1 },
    ny: { col: 1, row: 1 },
    nz: { col: 2, row: 1 },
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
    const { tileSize = this.DEFAULT_TILE_SIZE } = options
    const cols = this.ATLAS_COLS
    const rows = this.ATLAS_ROWS

    const canvas = document.createElement('canvas')
    canvas.width = tileSize * cols
    canvas.height = tileSize * rows

    this._drawAtlas(canvas, textureSet, tileSize)

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
   * 在指定 canvas 上绘制图集
   */
  static _drawAtlas(canvas, textureSet, tileSize) {
    const ctx = canvas.getContext('2d')
    ctx.imageSmoothingEnabled = false
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (textureSet.isSingle()) {
      const img = textureSet.map?.image
      if (img) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      }
      return
    }

    if (!textureSet.isMultiple()) return

    const faces = textureSet.faces
    const faceMap = {
      px: faces.px, nx: faces.nx,
      py: faces.py, ny: faces.ny,
      pz: faces.pz, nz: faces.nz,
    }

    for (const [faceName, tile] of Object.entries(this.FACE_TILES)) {
      const face = faceMap[faceName]
      const img = face?.map?.image
      if (!img) continue

      const dx = tile.col * tileSize
      const dy = tile.row * tileSize

      ctx.save()
      ctx.translate(dx + tileSize / 2, dy + tileSize / 2)
      // Canvas Y 轴向下，ctx.rotate 正角 = 顺时针
      // 但 shader rotateUV 正角 = 逆时针（标准数学约定）
      // 取负以匹配 shader 方向
      ctx.rotate((-face.rot * Math.PI) / 180)
      ctx.drawImage(img, -tileSize / 2, -tileSize / 2, tileSize, tileSize)
      ctx.restore()
    }
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
        const { tileSize = this.DEFAULT_TILE_SIZE } = options
        const canvas = /** @type {HTMLCanvasElement} */ (atlasTexture.image)
        if (canvas) {
          this._drawAtlas(canvas, textureSet, tileSize)
          atlasTexture.needsUpdate = true
          if (material) material.needsUpdate = true
          // 通知外部（如 ResourceSystem → LtViewer.requestRender）
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

  /* ================= Geometry UV 重映射 ================= */

  /**
   * 各面的 U/V 轴映射（与 UVUtils 的约定严格一致，非 shader）
   *
   * us/vs = 1 表示轴正向与 U/V 增大方向相同，-1 表示相反。
   * 投影坐标 pu = pos[axis] * sign 已编码方向，
   * 因此 UV 分配统一用 isMax → 图块右下（大 UV），无需额外符号反转。
   */
  static _FACE_AXES = {
    px: { u: 'z', us: 1,  v: 'y', vs: 1 },
    nx: { u: 'z', us: 1,  v: 'y', vs: 1 },
    py: { u: 'x', us: 1,  v: 'z', vs: -1 },
    ny: { u: 'x', us: 1,  v: 'z', vs: 1 },
    pz: { u: 'x', us: 1,  v: 'y', vs: 1 },
    nz: { u: 'x', us: -1, v: 'y', vs: 1 },
  }

  /**
   * 为 BoxGeometry 各面顶点分配 atlas 图块四角 UV
   *
   * 两条路径：
   * - 有 groups：按 group 处理（单 BoxGeometry，groups 齐全）
   * - 无 groups：法线聚类 + 贪心矩形检测（mergeGeometries 丢弃 groups 的情况）
   *
   * @param {THREE.BufferGeometry} geometry
   * @param {import('../../texture/texset/TextureSet.js').TextureSet} textureSet
   */
  static applyUVToGeometry(geometry, textureSet) {
    if (!textureSet.isMultiple()) return

    const pos = geometry.getAttribute('position')
    const uv = geometry.getAttribute('uv')
    const index = geometry.getIndex()
    const groups = geometry.groups

    const cols = this.ATLAS_COLS
    const rows = this.ATLAS_ROWS
    const faceOrder = ['px', 'nx', 'py', 'ny', 'pz', 'nz']
    const ai = { x: 0, y: 1, z: 2 }

    /* ========== 路径 A：有 groups，按 group 处理 ========== */
    if (groups && groups.length > 0) {
      for (let i = 0; i < groups.length; i++) {
        const group = groups[i]
        const faceName = faceOrder[i % 6]
        const tile = this.FACE_TILES[faceName]
        if (!tile) continue

        const { u: uAxis, us: uSign, v: vAxis, vs: vSign } = this._FACE_AXES[faceName]
        const ui = ai[uAxis], vIdx = ai[vAxis]

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
        if (verts.length === 0) continue

        this._assignFaceUV(verts, pos, uv, ui, vIdx, uSign, vSign, tile, cols, rows)
      }
      uv.needsUpdate = true
      return
    }

    /* ========== 路径 B：无 groups，法线聚类 + 贪心矩形检测 ========== */
    const normal = geometry.getAttribute('normal')
    if (!normal) return

    const DOM = 0.9
    const faceFromNormal = (nx, ny, nz) => {
      if (nx > DOM) return 'px'; if (nx < -DOM) return 'nx'
      if (ny > DOM) return 'py'; if (ny < -DOM) return 'ny'
      if (nz > DOM) return 'pz'; if (nz < -DOM) return 'nz'
      return null
    }
    const planeAxis = { px: 'x', nx: 'x', py: 'y', ny: 'y', pz: 'z', nz: 'z' }

    // 按 (faceName, planeCoord) 聚类，每类内收集 (pu, pv) → [vi...]
    const rawClusters = {}
    const vertexCount = pos.count

    for (let vi = 0; vi < vertexCount; vi++) {
      const faceName = faceFromNormal(normal.getX(vi), normal.getY(vi), normal.getZ(vi))
      if (!faceName) continue
      const tile = this.FACE_TILES[faceName]
      if (!tile) continue

      const { u: uAxis, us: uSign, v: vAxis, vs: vSign } = this._FACE_AXES[faceName]
      const ui = ai[uAxis], vIdx = ai[vAxis]
      const pIdx = ai[planeAxis[faceName]]
      const planeCoord = pos.array[vi * 3 + pIdx]

      const pu = pos.array[vi * 3 + ui] * uSign
      const pv = pos.array[vi * 3 + vIdx] * vSign

      const key = `${faceName}:${Math.round(planeCoord * 1e6) / 1e6}`
      if (!rawClusters[key]) {
        rawClusters[key] = { tile, ui, vIdx, uSign, vSign, grid: {} }
      }
      const cellKey = `${Math.round(pu * 1e6) / 1e6}:${Math.round(pv * 1e6) / 1e6}`
      if (!rawClusters[key].grid[cellKey]) rawClusters[key].grid[cellKey] = []
      rawClusters[key].grid[cellKey].push(vi)
    }

    // 逐聚类做贪心矩形检测
    for (const cluster of Object.values(rawClusters)) {
      const { tile, grid } = cluster
      const used = new Set() // "pu:pv" keys already assigned

      // 收集所有唯一的 pu / pv 值
      const puSet = new Set(), pvSet = new Set()
      for (const key of Object.keys(grid)) {
        if (used.has(key)) continue
        const [ps, qs] = key.split(':')
        puSet.add(Number(ps)); pvSet.add(Number(qs))
      }
      const puVals = [...puSet].sort((a, b) => a - b)
      const pvVals = [...pvSet].sort((a, b) => a - b)

      // 贪心搜索 2×2 矩形
      for (let ui = 0; ui < puVals.length; ui++) {
        for (let uj = ui + 1; uj < puVals.length; uj++) {
          const a = puVals[ui], b = puVals[uj]
          for (let vi = 0; vi < pvVals.length; vi++) {
            for (let vj = vi + 1; vj < pvVals.length; vj++) {
              const c = pvVals[vi], d = pvVals[vj]

              const kBL = `${Math.round(a*1e6)/1e6}:${Math.round(c*1e6)/1e6}`
              const kTL = `${Math.round(a*1e6)/1e6}:${Math.round(d*1e6)/1e6}`
              const kBR = `${Math.round(b*1e6)/1e6}:${Math.round(c*1e6)/1e6}`
              const kTR = `${Math.round(b*1e6)/1e6}:${Math.round(d*1e6)/1e6}`

              if (used.has(kBL) || used.has(kTL) || used.has(kBR) || used.has(kTR)) continue
              if (!grid[kBL] || !grid[kTL] || !grid[kBR] || !grid[kTR]) continue

              // 找到完整矩形 → 分配 UV
              used.add(kBL); used.add(kTL); used.add(kBR); used.add(kTR)

              const au0 = tile.col / cols, au1 = (tile.col + 1) / cols
              const av0 = 1 - (tile.row + 1) / rows, av1 = 1 - tile.row / rows

              // BL → (au0, av0), TL → (au0, av1), BR → (au1, av0), TR → (au1, av1)
              for (const vi of grid[kBL]) uv.setXY(vi, au0, av0)
              for (const vi of grid[kTL]) uv.setXY(vi, au0, av1)
              for (const vi of grid[kBR]) uv.setXY(vi, au1, av0)
              for (const vi of grid[kTR]) uv.setXY(vi, au1, av1)
            }
          }
        }
      }
    }

    uv.needsUpdate = true
  }

  /**
   * 为单个面的顶点集合分配 atlas 图块 UV
   */
  static _assignFaceUV(verts, pos, uv, ui, vIdx, uSign, vSign, tile, cols, rows) {
    let puMin = Infinity, puMax = -Infinity
    let pvMin = Infinity, pvMax = -Infinity
    for (const vi of verts) {
      const pu = pos.array[vi * 3 + ui] * uSign
      const pv = pos.array[vi * 3 + vIdx] * vSign
      if (pu < puMin) puMin = pu
      if (pu > puMax) puMax = pu
      if (pv < pvMin) pvMin = pv
      if (pv > pvMax) pvMax = pv
    }

    const au0 = tile.col / cols, au1 = (tile.col + 1) / cols
    const av0 = 1 - (tile.row + 1) / rows, av1 = 1 - tile.row / rows

    for (const vi of verts) {
      const pu = pos.array[vi * 3 + ui] * uSign
      const pv = pos.array[vi * 3 + vIdx] * vSign
      const uAtlas = Math.abs(pu - puMax) < 1e-9 ? au1 : au0
      const vAtlas = Math.abs(pv - pvMax) < 1e-9 ? av1 : av0
      uv.setXY(vi, uAtlas, vAtlas)
    }
  }
}
