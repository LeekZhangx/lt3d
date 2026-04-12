/**
 * TransformableBox 顶点位移 corner offset工具
 */
export class BoxOffsetUtil {

  /**
   * 顶点索引 → corner 索引映射表
   * 顺序与 THREE.BoxGeometry 内部一致
   */
  static VERTEX_CORNER_TABLE = [
    6,7,4,5,
    3,2,1,0,
    3,7,2,6,
    0,4,1,5,
    2,6,0,4,
    7,3,5,1
  ]


  /**
   * 根据 ruleTable， 将顶点位移offset应用到 BoxGeometry
   *
   * Voxel Engine 优化版：
   * 直接 ruleTable → vertices
   * 不再创建 corners 中间数组
   *
   * 流程：
   * 1. 扫描 ruleTable
   * 2. 找到 corner + axis
   * 3. 直接写入对应 vertices
   *
   * @param {THREE.BoxGeometry} geo
   * @param {object[]} ruleTable
   */
  static applyOffset(geo, ruleTable){

    const vertices = geo.getAttribute('position').array

    const table = this.VERTEX_CORNER_TABLE

    for(let bit = 8; bit < 32; bit++){

      const rule = ruleTable[bit]
      if(!rule || rule.sign !== 1) continue

      const val = rule.val
      if(val === undefined) continue

      const relative = bit - 8

      const cornerIndex = (relative / 3) | 0
      const axisIndex = relative % 3

      /**
       * 找到所有使用该 corner 的顶点
       */
      for(let v = 0; v < 24; v++){

        if(table[v] !== cornerIndex) continue

        const idx = v * 3 + axisIndex

        vertices[idx] += val
      }

    }

    geo.getAttribute('position').needsUpdate = true
  }

}
