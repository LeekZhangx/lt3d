import * as THREE from 'three'
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils'

/**
 * 普通Box工厂
 */
export class CommonBoxFactory{

    /**
   * 直接创建对应的简单几何体
   * - 根据box直接创建长方体
   * - 不做其他优化处理
   * @type {number[]} box
   *  [
   *     x1, y1, z1,
   *     x2, y2, z2
   *   ]
   *   - 不携带ex数据
   * @param {box[]} commonBoxes 这里的box不携带ex数据
   * @param {number} grid
   * @returns {THREE.BufferGeometry} 单个几何体
   *   - 已 translate 到世界坐标
   *   - 已应用 ex 变形（如果存在）
   *   - 已设置世界对齐 UV
   */
  static createDirectly(commonBoxes, grid) {

    if (!commonBoxes || commonBoxes.length === 0) return null

    let geometries = []

    for(let i = 0; i < commonBoxes.length; i++){
      const [x1, y1, z1, x2, y2, z2] = commonBoxes[i]

      /* ================= 尺寸 & 位置 ================= */

      // BoxGeometry 使用中心点 + 尺寸
      const sizeX = Math.abs(x2 - x1) / grid
      const sizeY = Math.abs(y2 - y1) / grid
      const sizeZ = Math.abs(z2 - z1) / grid

      const posX = (x1 + x2) / 2 / grid
      const posY = (y1 + y2) / 2 / grid
      const posZ = (z1 + z2) / 2 / grid

      // 基础立方体
      const geo = new THREE.BoxGeometry(sizeX, sizeY, sizeZ)

      geo.translate(posX, posY, posZ)


      //不进行uv处理，由TriplanarUtil完成贴图映射

      /* ================= UV 处理 ================= */
      //这里的Box对角线和Lt完全相反，但是为普通的立方体，故不处理

      // UV 始终在最终几何形态上计算
      // 确保 ex / 非 ex 表现一致
      // UVUtils.applyBoxUV(
      //   geo,
      //   { x1, y1, z1, x2, y2, z2 },
      //   grid
      // )

      geometries.push(geo)
    }

    const geometry =
      geometries.length === 1
      ? geometries[0]
      : BufferGeometryUtils.mergeGeometries(geometries)

    return geometry
  }

  /**
   * Voxel 逐面生成，创建几何体
   * - 体素化拆分再拼，会消除相邻的面，但也会装产生大量的面
   * @type {number[]} box
   *  [
   *     x1, y1, z1,
   *     x2, y2, z2
   *   ]
   * @param {box[]} commonBoxes 这里的box不携带ex数据
   * @param {number} grid
   * @returns {THREE.BufferGeometry}
   */
  static createVoxel(commonBoxes, grid){

    /**
     * normalBoxes
     *    ↓
     * 体素化
     *    ↓
     * for 6 个方向
     *    ↓
     * 构建 2D mask
     *    ↓
     * Greedy 合并
     *    ↓
     * emitQuad 生成大面
     *    ↓
     * geometry
     */
      if (!commonBoxes || commonBoxes.length === 0) return null

      const voxels = new Set()
      const key = (x,y,z) => `${x},${y},${z}`

      const scale = 1 /grid

      // -------------------------------------------------
      // 体素化
      // -------------------------------------------------
      for (const box of commonBoxes) {
        const [x1,y1,z1,x2,y2,z2] = box
        for (let x = x1; x < x2; x++) {
          for (let y = y1; y < y2; y++) {
            for (let z = z1; z < z2; z++) {
              voxels.add(key(x,y,z))
            }
          }
        }
      }

      const positions = []
      const normals = []
      const uvs = []
      const indices = []

      let vertexOffset = 0

      // -------------------------------------------------
      // 官方 faces（固定 CCW）
      // -------------------------------------------------
      const faces = [

        { // -X
          dir: [-1, 0, 0],
          corners: [
            [0, 0, 0], // 左下
            [0, 0, 1], // 右下
            [0, 1, 0], // 左上
            [0, 1, 1], // 右上
          ],
        },

        { // +X
          dir: [1, 0, 0],
          corners: [
            [1, 0, 1], // 左下
            [1, 0, 0], // 右下
            [1, 1, 1], // 左上
            [1, 1, 0], // 右上
          ],
        },

        { // -Y
          dir: [0, -1, 0],
          corners: [
            [0, 0, 0], // 左下
            [1, 0, 0], // 右下
            [0, 0, 1], // 左上
            [1, 0, 1], // 右上
          ],
        },

        { // +Y
          dir: [0, 1, 0],
          corners: [
            [0, 1, 1], // 左下
            [1, 1, 1], // 右下
            [0, 1, 0], // 左上
            [1, 1, 0], // 右上
          ],
        },

        { // -Z
          dir: [0, 0, -1],
          corners: [
            [1, 0, 0], // 左下
            [0, 0, 0], // 右下
            [1, 1, 0], // 左上
            [0, 1, 0], // 右上
          ],
        },

        { // +Z
          dir: [0, 0, 1],
          corners: [
            [0, 0, 1], // 左下
            [1, 0, 1], // 右下
            [0, 1, 1], // 左上
            [1, 1, 1], // 右上
          ],
        },

      ];

      // -------------------------------------------------
      // 遍历所有 voxel
      // -------------------------------------------------
      for (const voxelKey of voxels) {

        const [x,y,z] = voxelKey.split(',').map(Number)

        for (const {dir, corners} of faces) {

          const neighbor = voxels.has(
            key(
              x + dir[0],
              y + dir[1],
              z + dir[2]
            )
          )

          if (neighbor) continue

          const ndx = vertexOffset

          // push 4 顶点
          for (const pos of corners) {

            positions.push(
              (pos[0] + x) / grid,
              (pos[1] + y) / grid,
              (pos[2] + z) / grid
            )

            normals.push(
              dir[0],
              dir[1],
              dir[2]
            )
          }

          // indices 永远固定
          indices.push(
            ndx,    ndx+1,  ndx+2,
            ndx+2,  ndx+1,  ndx+3
          )

          // UV（单独处理，不影响正反）
          for (let i = 0; i < 4; i++) {

            const px = positions[(vertexOffset + i) * 3 + 0]
            const py = positions[(vertexOffset + i) * 3 + 1]
            const pz = positions[(vertexOffset + i) * 3 + 2]

            let uu, vv

            // X 面
            if (dir[0] !== 0) {
              uu = dir[0] > 0 ? -pz : pz
              vv = py
            }
            // Y 面
            else if (dir[1] !== 0) {
              uu = px
              vv = dir[1] > 0 ? -pz : pz
            }
            // Z 面
            else {
              uu = dir[2] > 0 ? px : -px
              vv = py
            }

            uvs.push(uu, vv)
          }

          vertexOffset += 4
        }
      }

      const geometry = new THREE.BufferGeometry()

      geometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(positions,3)
      )

      geometry.setAttribute(
        'normal',
        new THREE.Float32BufferAttribute(normals,3)
      )

      geometry.setAttribute(
        'uv',
        new THREE.Float32BufferAttribute(uvs,2)
      )

      geometry.setIndex(indices)

      return geometry
  }

  /**
   * Greedy Meshing，贪婪网格 创建几何体
   * - 体素化box，将相邻的合并且合并平面
   * - 时间复杂度高 O(n^2)，推荐worker异步方法
   * @type {number[]} box
   *  [
   *     x1, y1, z1,
   *     x2, y2, z2
   *   ]
   * @param {box[]} commonBoxes 这里的box不携带ex数据
   * @param {number} grid
   * @returns {THREE.BufferGeometry}
   */
  static createGreedy(commonBoxes, grid) {

    if (!commonBoxes || commonBoxes.length === 0) return null

    const voxels = new Set()
    const key = (x,y,z) => `${x},${y},${z}`

    // ===============================
    // 1 体素化 + 计算边界
    // ===============================

    let minX=Infinity, minY=Infinity, minZ=Infinity
    let maxX=-Infinity, maxY=-Infinity, maxZ=-Infinity

    for (const box of commonBoxes) {

      const [x1,y1,z1,x2,y2,z2] = box

      minX = Math.min(minX, x1)
      minY = Math.min(minY, y1)
      minZ = Math.min(minZ, z1)

      maxX = Math.max(maxX, x2)
      maxY = Math.max(maxY, y2)
      maxZ = Math.max(maxZ, z2)

      for (let x = x1; x < x2; x++)
        for (let y = y1; y < y2; y++)
          for (let z = z1; z < z2; z++)
            voxels.add(key(x,y,z))
    }

    const dims = [
      maxX - minX,
      maxY - minY,
      maxZ - minZ
    ]

    // ===============================
    // 2 几何缓存
    // ===============================

    const positions = []
    const normals = []
    const uvs = []
    const indices = []

    let vertexOffset = 0

    // ===============================
    // 3 Greedy Meshing
    // ===============================

    for (let d = 0; d < 3; d++) {

      const u = (d + 1) % 3
      const v = (d + 2) % 3

      const x = [0,0,0]
      const q = [0,0,0]
      q[d] = 1

      for (x[d] = -1; x[d] < dims[d]; ) {

        const mask = []
        let n = 0

        // ---------- 构建 mask ----------
        for (x[v] = 0; x[v] < dims[v]; x[v]++) {
          for (x[u] = 0; x[u] < dims[u]; x[u]++) {

            const ax = x[0] + minX
            const ay = x[1] + minY
            const az = x[2] + minZ

            const bx = ax + q[0]
            const by = ay + q[1]
            const bz = az + q[2]

            const a = (x[d] >= 0) && voxels.has(key(ax,ay,az))
            const b = (x[d] < dims[d]-1) && voxels.has(key(bx,by,bz))

            if (a !== b) {
              mask[n++] = a ? 1 : -1
            } else {
              mask[n++] = 0
            }
          }
        }

        x[d]++

        // ---------- Greedy 合并 ----------
        n = 0

        for (let j = 0; j < dims[v]; j++) {
          for (let i = 0; i < dims[u]; ) {

            const c = mask[n]
            if (!c) {
              i++; n++
              continue
            }

            // 横向扩展
            let w
            for (w = 1; i + w < dims[u] && mask[n + w] === c; w++) {}

            // 纵向扩展
            let h
            let done = false
            for (h = 1; j + h < dims[v]; h++) {
              for (let k = 0; k < w; k++) {
                if (mask[n + k + h*dims[u]] !== c) {
                  done = true
                  break
                }
              }
              if (done) break
            }

            // ---------- 生成大 Quad ----------
            x[u] = i
            x[v] = j

            const du = [0,0,0]
            const dv = [0,0,0]

            du[u] = w
            dv[v] = h

            const normal = [0,0,0]
            normal[d] = c > 0 ? 1 : -1

            const ndx = vertexOffset

            const verts = [
              [x[0], x[1], x[2]],
              [x[0]+du[0], x[1]+du[1], x[2]+du[2]],
              [x[0]+dv[0], x[1]+dv[1], x[2]+dv[2]],
              [x[0]+du[0]+dv[0], x[1]+du[1]+dv[1], x[2]+du[2]+dv[2]]
            ]

            for (const p of verts) {

              positions.push(
                (p[0] + minX) / grid,
                (p[1] + minY) / grid,
                (p[2] + minZ) / grid
              )

              normals.push(...normal)

              // 简单平面UV
              let uu, vv

              if (d === 0) {
                // ±X 面
                uu = p[2]   // Z
                vv = p[1]   // Y
              }
              else if (d === 1) {
                // ±Y 面
                uu = p[0]   // X
                vv = p[2]   // Z
              }
              else {
                // ±Z 面
                uu = p[0]   // X
                vv = p[1]   // Y
              }

              // 负方向翻转 U
              if (normal[d] < 0) {
                uu = -uu
              }

              uvs.push(uu, vv)
            }

            if (c > 0) {

            // 正方向
            indices.push(
                ndx, ndx+1, ndx+2,
                ndx+2, ndx+1, ndx+3
              )
            } else {
              // 负方向 → 翻转 winding
              indices.push(
                ndx, ndx+2, ndx+1,
                ndx+2, ndx+3, ndx+1
              )
            }

            vertexOffset += 4

            // 清空 mask
            for (let l = 0; l < h; l++)
              for (let k = 0; k < w; k++)
                mask[n + k + l*dims[u]] = 0

            i += w
            n += w
          }
        }
      }
    }

    // ===============================
    // 4 创建几何体
    // ===============================

    if (positions.length === 0) {
      console.warn("Greedy mesh produced empty geometry")
      return null
    }

    const geometry = new THREE.BufferGeometry()

    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions,3)
    )

    geometry.setAttribute(
      'normal',
      new THREE.Float32BufferAttribute(normals,3)
    )

    geometry.setAttribute(
      'uv',
      new THREE.Float32BufferAttribute(uvs,2)
    )

    geometry.setIndex(indices)

    return geometry
  }
}
