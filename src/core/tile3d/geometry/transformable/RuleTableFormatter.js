import { LtUtil } from "../../util/lt/LtUtil.js"

/**
 * 将 mask 和 offset 信息解析并格式化
 */
export class RuleTableFormatter{

  /**
   * 从 ex 数组中解析出位移量（已按 grid 缩放）
   *
   * @param {number[]} exArr
   * @param {number|undefined} grid
   * @return {number[]}
   *
   * 返回示例：
   * [ val1, val2, val3 ... ]
   */
  static _parseExOffsets(exArr, grid) {
    if (!Array.isArray(exArr) || exArr.length < 1) {
      return []
    }
    const realGrid = LtUtil.normalizeGrid(grid)
    const scale = 1 / realGrid

    const result = []

    // 从 exArr[0] 开始
    for (let i = 0; i < exArr.length; i++) {
      const [a, b] = LtUtil.splitInt32ToInt16(exArr[i])

      if (a !== 0) result.push(a * scale)
      if (b !== 0) result.push(b * scale)
    }

    return result
  }

  /**
   * 根据 mask 构建 corner 位移规则表
   *
   * 一个mask顶点位移标识 对应 一个位移量
   *
   * mask 约定：
   * - bit 2 ~ 7 : corner filpped 镜像区 （6 bit）6面
   * - bit 8 ~ 31：corner 位移区（24 bit）8顶点各3个轴
   *
   * bit → 语义映射：
   *   cornerIndex = floor((bit - 8) / 3)  // 0 ~ 7
   *   axisIndex   = (bit - 8) % 3         // 0:x 1:y 2:z
   *
   * @param {number} mask 未解析的 face flipped 信息 和 corner offset 信息
   * @param {number[]} exArr 未解析的 offset 值数组
   * @param {number} grid
   * @returns {{
   *  ruleTable: Array<{offset:number, sign:number, val:number}>,
   *  needCut: number
   * }}
   */
  static formatCornerRuleTable(mask, exArr, grid) {

    //当位移超过原先尺寸，也就是size的值则需要切割
    //在offset处理
    let needCut = 0

    const binStr = LtUtil.decToBinStr32(mask)

    const ruleTable = new Array(32)
    //空置位
    ruleTable[0]
    ruleTable[1]

    //filpped
    const n = ['E','W','S','N', 'U','D']

    for (let bit = 2; bit <= 7; bit++) {
      let sign = 0
      if (binStr[bit] !== '1'){
        sign = 0
        // continue;
      }else{
        sign = 1
      }

      ruleTable[bit] = {
        sign: sign,
        name: n[bit - 2]
      }

    }


    //offset
    const cornerNames = [
      'WDS','WDN','WUS','WUN',
      'EDS','EDN','EUS','EUN'
      ]

    const axes = ['X' ,'Y', 'Z']

    // X Y Z
    const CORNER_DIR = [
      [-1,-1, 1], // WDS
      [-1,-1,-1], // WDN
      [-1, 1, 1], // WUS
      [-1, 1,-1], // WUN
      [ 1,-1, 1], // EDS
      [ 1,-1,-1], // EDN
      [ 1, 1, 1], // EUS
      [ 1, 1,-1], // EUN
    ]

    // mask顺序 Z Y X → offset应用顺序 X Y Z
    const AXIS_MAP = [2,1,0]

    let offsetArr = this._parseExOffsets(exArr, grid)

    // console.log(offsetArr);

    //记录offsetArr的使用个数
    let count = 0;

    //offset数组的值 和 binStr 对应的是逆序的，
    for (let bit = 8; bit <= 31; bit++) {

      const sign = binStr[bit] === '1' ? 1 : 0

      const i = bit - 8
      const cornerIndex = Math.floor(i / 3)
      const axisIndexZYX = i % 3 //默认的index
      const axisIndexXYZ = AXIS_MAP[axisIndexZYX]

      const name = cornerNames[cornerIndex]
      const axe  = axes[axisIndexXYZ]

      const newBit = 8 + cornerIndex * 3 + axisIndexXYZ

      let val = 0
      if (sign) {
        val = offsetArr[offsetArr.length -1 - count]
        count++
      }

      ruleTable[newBit] = {
        sign,
        name: name + ' ' + axe,
        val
      }

      // 任意顶点向外扩展 → needCut
      if (!needCut && sign) {

        const axisIndexXYZ = AXIS_MAP[axisIndexZYX]
        const dir = CORNER_DIR[cornerIndex][axisIndexXYZ]

        if (val * dir > 0) {
          needCut = 1
        }

      }

    }

    // this.logRuleTable(ruleTable)

    return {
      ruleTable,
      needCut
    }
  }

  static logRuleTable(ruleTable){

    const cornerNames = [
      'WDS','WDN','WUS','WUN',
      'EDS','EDN','EUS','EUN'
    ]

    const axes = ['X','Y','Z']

    let title = '  Flipped     '
    let pos   = 'E W S N U D  '
    let sign  = ''

    // flip 信息
    for (let bit = 2; bit <= 7; bit++) {
      const r = ruleTable[bit]
      sign += (r?.sign ?? 0) + ' '
    }

    sign += ' '

    // offset 信息
    for (let c = 0; c < 8; c++) {

      const name = cornerNames[c]

      title += name + '   '

      for (let a = 0; a < 3; a++) {

        const bit = 8 + c * 3 + a
        const r = ruleTable[bit]

        pos += axes[a] + ' '
        sign += (r?.sign ?? 0) + ' '

      }

      title += '  '
      pos   += '  '
      sign  += '  '

    }

    console.log(title)
    console.log(pos)
    console.log(sign)

  }
}
