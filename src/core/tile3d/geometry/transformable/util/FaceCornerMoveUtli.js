export class FaceCornerMoveUtil {

  static faceMasks = {

    W:0b00001111,
    E:0b11110000,

    D:0b00110011,
    U:0b11001100,

    S:0b01010101,
    N:0b10101010

  }

  static opposite = {
    W:'E',E:'W',
    S:'N',N:'S',
    U:'D',D:'U'
  }

  static axes = ['X','Y','Z']

  static popcount(x){
    x = x - ((x >> 1) & 0x55555555)
    x = (x & 0x33333333) + ((x >> 2) & 0x33333333)
    return (((x + (x >> 4)) & 0x0F0F0F0F) * 0x01010101) >> 24
  }

  /**
   * 检测是否存在整面移动：
   * 若某 face 的 ≥3 个 corner 在同一轴移动，
   * 且移动距离 = cube size，则返回该 face 与其 opposite
   *
   * ruleTable
   * 8-31  : 8个corner × 3轴 (Z,Y,X)
   *         每项包含 {sign, name, val}
   *
   * cornerIndex = floor((i-8)/3)
   * axisIndex   = (i-8)%3  -> 0:Z 1:Y 2:X
   *
   * 算法流程：
   * 1. 扫描 ruleTable 中 sign=1 的 corner 位移
   * 2. 按 axis 记录移动的 corner bitmask
   * 3. 若某轴 ≥3 个 corner 位移
   * 4. 与 faceMask 做 bitmask 判断
   * 5. 命中则返回 face + opposite
   *
   * @param {object[]} ruleTable [{sign, name, val}]，这里只关注8-31为的corner信息
   * @param {number[]} size [sizeX, sizeY, sizeZ]
   */
  static detect(ruleTable, size){

    const axisSize = {
      X: size[0],
      Y: size[1],
      Z: size[2]
    }

    // 每个轴移动的 corner bitmask
    const moved = { X:0, Y:0, Z:0 }

    // 记录该轴位移方向
    const direction = { X:0, Y:0, Z:0 }


    for(let i=8;i<32;i++){

      const item = ruleTable[i]
      if(item.sign !== 1) continue

      const local = i - 8
      const corner = (local / 3) | 0
      const axisId = local % 3

      //table中的顺序是按照Z Y X,循环8个corner
      const axis =
        axisId === 0 ? 'Z' :
        axisId === 1 ? 'Y' :
                      'X'

      const val = item.val

      // 必须移动完整 cube size
      if(Math.abs(val) !== axisSize[axis]) continue

      // 记录 corner 位移
      moved[axis] |= (1 << corner)

      // 保存位移方向
      direction[axis] = Math.sign(val)

    }

    const result = []

    // 检测是否形成 face move
    for(const axis of this.axes){

      const mask = moved[axis]

      // 至少3个corner完整移动到相对面,才判断是面发生了移动
      if(this.popcount(mask) < 3) continue

      for(const face in this.faceMasks){

        const faceMask = this.faceMasks[face]

        if(this.popcount(mask & faceMask) >= 3){

          result.push({
            face,
            opposite:this.opposite[face],
            axis,
            direction:direction[axis]
          })

        }

      }

    }

    return result
  }

}
