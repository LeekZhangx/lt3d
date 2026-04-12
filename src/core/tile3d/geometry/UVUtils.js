import * as THREE from 'three'

/**
 * ============================================================
 * UVUtils
 *
 * 负责 BoxGeometry 的世界对齐 UV 映射
 *
 * 核心规则：
 * - 一个 block 面 = 1 × 1 UV
 * - grid 决定 block 内的细分比例
 * - UV = box 在 block 内的裁剪区域
 * - 与几何尺寸（sizeX/Y/Z）无关
 *
 * ============================================================
 */
export class UVUtils {

  /**
   * 给 BoxGeometry 设置基于 grid 的 UV
   *
   * @param {THREE.BufferGeometry} geometry
   *   必须是 THREE.BoxGeometry（可 ex 变形）
   *
   * @param {Object | number[]} box
   *   {
   *     x1, y1, z1,
   *     x2, y2, z2
   *   }
   *   —— LT 坐标（整数）
   *
   * @param {number} grid
   *   block 细分数（16 / 32 / 64 …）
   */
  static applyBoxUV(geometry, box, grid) {

    let x1, y1, z1, x2, y2, z2

    if (Array.isArray(box)) {
      [x1, y1, z1, x2, y2, z2] = box
    } else {
      ({ x1, y1, z1, x2, y2, z2 } = box)
    }

    const scale = 1 / grid
    // 将 block 坐标映射到 [0,1] UV
    let nx1 = x1 * scale
    let nx2 = x2 * scale
    let ny1 = y1 * scale
    let ny2 = y2 * scale
    let nz1 = z1 * scale
    let nz2 = z2 * scale

    const uv = geometry.getAttribute('uv')
    /**
     * Indexed BoxGeometry UV face layout (24 vertices)
     *
     *  0~3   : +X
     *  4~7   : -X
     *  8~11  : +Y
     * 12~15  : -Y
     * 16~19  : +Z
     * 20~23  : -Z
     */

    // +X (East) u: -Z  v: +Y
    this._setFaceUV(uv, 0,
        nz1, ny1,
        nz2, ny2,
    )

    // -X (West) u: +Z  v: +Y
    this._setFaceUV(uv, 4,
        nz2, ny1,
        nz1, ny2,
        true
    )

    // +Y (Up) u: +X  v: -Z
    this._setFaceUV(uv, 8,
        nx2, nz1,
        nx1, nz2,
        true
    )

    // -Y (Down) u: +X  v: +Z
    this._setFaceUV(uv, 12,
        nx1, nz1,
        nx2, nz2
    )

    // +Z (South / Front) u: +X  v: +Y
    this._setFaceUV(uv, 16,
        nx1, ny1,
        nx2, ny2
    )

    // -Z (North / Back) u: -X  v: +Y
    this._setFaceUV(uv, 20,
        nx2, ny1,
        nx1, ny2,
        true
    )

    uv.needsUpdate = true
  }

  /**
   * 给 BoxGeometry 的一个面（2 个三角形）设置 UV
   *
   * @param {THREE.BufferAttribute} uv
   * @param {THREE.BufferAttribute} index
   * @param {number} start 顶点索引（不是三角索引）
   *
   * @param {number} u1 横向
   * @param {number} v1 纵向
   * @param {number} u2
   * @param {number} v2
   *
   * UV 布局（与 BoxGeometry 默认一致）：
   *  0 2 1
   *  2 3 1
   * v2  0┌──────┐ 1
   *      │      │
   *      │      │
   * v1  2└──────┘ 3
   *      u1   u2
   */
  static _setFaceUV(uv, start, u1, v1, u2, v2, flipU = false) {
    const i = start

    if (!flipU) {

      // 0 左上
      uv.setXY(i + 0, u1, v2)
      // 1 右上
      uv.setXY(i + 1, u2, v2)
      // 2 左下
      uv.setXY(i + 2, u1, v1)
      // 3 右下
      uv.setXY(i + 3, u2, v1)

    } else {

      // U翻转
      uv.setXY(i + 0, u2, v2)
      uv.setXY(i + 1, u1, v2)
      uv.setXY(i + 2, u2, v1)
      uv.setXY(i + 3, u1, v1)

    }
  }

  /**
   * 给 BoxGeometry 设置基于 grid 的 UV
   *
   * @param {THREE.BufferGeometry} geometry
   *   必须是 THREE.BoxGeometry（可 ex 变形）
   *
   * @param {Object} box
   *   {
   *     x1, y1, z1,
   *     x2, y2, z2
   *   }
   *   —— LT 坐标（整数）
   *
   * @param {number} grid
   *   block 细分数（16 / 32 / 64 …）
   */
  static applyBoxUVNonIndexed(geometry, box, grid) {
    // console.log(box);

    const { x1, y1, z1, x2, y2, z2 } = box
    const scale = 1/grid
    // 将 block 坐标映射到 [0,1] UV
    let nx1 = x1 % grid
    let nx2 = x2 % grid
    let ny1 = y1 % grid
    let ny2 = y2 % grid
    let nz1 = z1 % grid
    let nz2 = z2 % grid

    if(0 == nx2) nx2 = grid
    if(0 == ny2) ny2 = grid
    if(0 == nz2) nz2 = grid

    nx1/= grid
    nx2/= grid
    ny1/= grid
    ny2/= grid
    nz1/= grid
    nz2/= grid

    const uv = geometry.getAttribute('uv')

    /**
     * BoxGeometry index 顺序（稳定）：
     *
     *  0~5   : +X
     *  6~11  : -X
     * 12~17  : +Y
     * 18~23  : -Y
     * 24~29  : +Z
     * 30~35  : -Z
     */

    // +X（右）East：U=Z, V=Y
    this._setFaceUVNonIndexed(uv, 0,
        nz2, ny1,  // minU, minV // 翻转U方向
        nz1, ny2, true   // maxU, maxV
    )

    // -X（左）West：U=Z, V=Y，但需要考虑纹理方向
    this._setFaceUVNonIndexed(uv, 6,
        nz1, ny1,  // 注意：这里是 nz2 作为 minU，确保纹理方向正确
        nz2, ny2
    )

    // +Y（上）Up：U=X, V=Z
    this._setFaceUVNonIndexed(uv, 12,
        nx1, nz2,  // minU, minV // 翻转U方向
        nx2, nz1, true    // maxU, maxV
    )

    // -Y（下）Down：U=X, V=Z
    this._setFaceUVNonIndexed(uv, 18,
        nx1, nz1,
        nx2, nz2
    )

    // +Z（前）South：U=X, V=Y
    this._setFaceUVNonIndexed(uv, 24,
        nx1, ny1,
        nx2, ny2
    )

    // -Z（后）North：U=X, V=Y，纹理需要翻转
    this._setFaceUVNonIndexed(uv, 30,
        nx2, ny1,  // 翻转U方向
        nx1, ny2, true
    )

    uv.needsUpdate = true

    // console.log(uv);

  }

  /**
   * 给 BoxGeometry 的一个面（2 个三角形）设置 UV
   *
   * @param {THREE.BufferAttribute} uv
   * @param {THREE.BufferAttribute} index
   * @param {number} start
   *   该面的 index 起始位置（0 / 6 / 12 / ...）
   *
   * @param {number} u1
   * @param {number} v1
   * @param {number} u2
   * @param {number} v2
   *
   * UV 布局（与 BoxGeometry 默认一致）：
   *
   *  0(u1,v2) ---- 1(u2,v2)
   *     |      /     |
   *     |     /      |
   *  2(u1,v1) ---- 3(u2,v1)
   */
  static _setFaceUVNonIndexed(uv, start, u1, v1, u2, v2, flipU = false) {
      if (flipU) {
        [u1, u2] = [u2, u1]
      }

      // 直接使用顶点索引（每个面6个顶点，两个三角形）
      // 三角形1：0→2→1
      uv.setXY((start + 0), u1, v2)
      uv.setXY((start + 1), u1, v1)
      uv.setXY((start + 2), u2, v2)

      // 三角形2：2→3→1
      uv.setXY((start + 3), u1, v1)
      uv.setXY((start + 4), u2, v1)
      uv.setXY((start + 5), u2, v2)
  }
}
