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
      // TextureSet 顺时针旋转，Canvas flipY 会反转方向，取负补偿
      ctx.rotate((face.rot * Math.PI) / 180)
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
   * rotateUV（与 shader BoxSixMappingUtil 一致 — mat2(c,-s; s,c) CCW）
   */
  /**
   * UVUtils 已设正确块内相对 UV（含 flipU 方向），直接线性映射到 atlas 图块位置
   */
  static applyUVToGeometry(geometry, textureSet) {
    if (!textureSet.isMultiple()) return
    const uv = geometry.getAttribute('uv')
    const index = geometry.getIndex()
    const groups = geometry.groups
    const faceOrder = ['px', 'nx', 'py', 'ny', 'pz', 'nz']

    if (groups && groups.length > 0) {
      for (let i = 0; i < groups.length; i++) {
        const group = groups[i]
        const tile = this.FACE_TILES[faceOrder[i % 6]]
        if (!tile) continue
        const au0 = tile.col / 3, au1 = (tile.col + 1) / 3
        const av0 = 1 - (tile.row + 1) / 2, av1 = 1 - tile.row / 2
        const visited = new Set()
        const proc = (vi) => {
          if (visited.has(vi)) return
          visited.add(vi)
          uv.setXY(vi, au0 + uv.getX(vi) * (au1 - au0), av0 + uv.getY(vi) * (av1 - av0))
        }
        if (index) for (let j = 0; j < group.count; j++) proc(index.getX(group.start + j))
        else for (let j = 0; j < group.count; j++) proc(group.start + j)
      }
      uv.needsUpdate = true
      return
    }
    // 无 groups：逐顶点法线判定
    const normal = geometry.getAttribute('normal')
    if (!normal) return
    for (let vi = 0; vi < uv.count; vi++) {
      const nx = normal.getX(vi), ny = normal.getY(vi), nz = normal.getZ(vi)
      let faceName
      if (nx > 0.9) faceName = 'px'; else if (nx < -0.9) faceName = 'nx'
      else if (ny > 0.9) faceName = 'py'; else if (ny < -0.9) faceName = 'ny'
      else if (nz > 0.9) faceName = 'pz'; else if (nz < -0.9) faceName = 'nz'
      else continue
      const tile = this.FACE_TILES[faceName]
      if (!tile) continue
      const au0 = tile.col / 3, au1 = (tile.col + 1) / 3
      const av0 = 1 - (tile.row + 1) / 2, av1 = 1 - tile.row / 2
      uv.setXY(vi, au0 + uv.getX(vi) * (au1 - au0), av0 + uv.getY(vi) * (av1 - av0))
    }
    uv.needsUpdate = true
  }
}
