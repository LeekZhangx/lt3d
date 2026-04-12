//修改自 BlockGeometryFactory.createCommonBoxesGreedy()
self.onmessage = function(e) {
  const { normalBoxes, grid } = e.data

  if (!normalBoxes || normalBoxes.length === 0){
    postMessage(null)
    return null
  }

  const voxels = new Set()
  const key = (x,y,z) => `${x},${y},${z}`

  // ===============================
  // 1 体素化 + 计算边界
  // ===============================

  let minX=Infinity, minY=Infinity, minZ=Infinity
  let maxX=-Infinity, maxY=-Infinity, maxZ=-Infinity

  for (const box of normalBoxes) {

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
  // 4 传输数据
  // ===============================


  // ---------- 转成 TypedArray，避免额外拷贝 ----------
  // 假设 positions / normals / uvs / indices 是普通 JS 数组

  const posArray = new Float32Array(positions)
  const normalArray = new Float32Array(normals)
  const uvArray = new Float32Array(uvs)
  const indexArray = new Uint32Array(indices)

  postMessage(
    {
      positions: posArray,
      normals: normalArray,
      uvs: uvArray,
      indices: indexArray
    },
    [
      posArray.buffer,
      normalArray.buffer,
      uvArray.buffer,
      indexArray.buffer
    ]
  )

}
