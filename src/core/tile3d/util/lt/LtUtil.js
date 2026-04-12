/**
 * LtUtil
 * ----------------------------------------
 * 职责：
 * 1. ex 位移数据解析
 * 2. grid 归一化
 * 3. 几何生成阶段的基础数值工具
 *
 * 设计原则：
 * - 不处理字符串
 * - 不处理 AST / format
 * - 不保存状态
 * - 只返回纯数据
 */

class LtUtil {
  /**
   * 规范化 grid, 默认值为16
   * @param {number|undefined} grid
   * @return {number}
   */
  static normalizeGrid(grid) {
    if (!grid) return 16
    return grid
  }

  /**
   * 将 int32 拆成两个 int16（有符号）
   *
   * [high 16-31, low 0-15]
   * @param {number} value
   * @return {[number, number]}
   */
  static splitInt32ToInt16(value) {
    //无符号位移
    const low  = value & 0xffff
    const high = (value >>> 16) & 0xffff
    return [LtUtil.int16(high), LtUtil.int16(low)]
  }

  /**
   * 10进制转为仅有32位的2进制字符串
   * @param {String|Number} num_10 十进制下的数字或字符串
   * @return {string} 2进制字符串
   */
  static decToBinStr32(num_10){
      let tmp = (Number(num_10)  >>> 0).toString(2);
      if (tmp.length === 32)return tmp;

      let need = 32 - tmp.length;
      let str = ''
      for (let i = 0; i < need; i++)str+='0';
      return str + tmp;
  }

  /**
   * 将 16 位值转为有符号整数
   * @param {number} v
   * @return {number}
   */
  static int16(v) {
    return v & 0x8000 ? v - 0x10000 : v
  }

  //for test
  static buildVertexCornerTable(geo) {

    const pos = geo.getAttribute('position').array
    const table = []

    for (let i = 0; i < pos.length; i += 3) {

      const x = pos[i]
      const y = pos[i + 1]
      const z = pos[i + 2]

      table.push(this.getCornerIndex(x, y, z))
    }

    console.log("AUTO VERTEX_CORNER_TABLE =", table)
    return table
  }

  //for test
  static getCornerIndex(x, y, z) {

    const east  = x > 0
    const up    = y > 0
    const south = z > 0

    if (!east && !up && south) return 0 // WDS
    if (!east && !up && !south) return 1 // WDN
    if (!east && up && south) return 2 // WUS
    if (!east && up && !south) return 3 // WUN
    if (east && !up && south) return 4 // EDS
    if (east && !up && !south) return 5 // EDN
    if (east && up && south) return 6 // EUS
    if (east && up && !south) return 7 // EUN
  }
}

export { LtUtil }
