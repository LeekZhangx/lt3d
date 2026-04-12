/**
 * 四边形平面对角线翻转工具，只支持和THREE.BoxGeometry的index相同的规则顺序
 */
export class FaceFlipUtil {

  static FACE_INDEX = {
    E:0, // +X
    W:1, // -X
    U:2, // +Y
    D:3, // -Y
    S:4, // +Z
    N:5  // -Z
  }

  /**
   * 翻转对角线
   * @param {*} index
   * @param {*} face
   * @returns
   */
  static flipOnce(index, face){

    const f = this.FACE_INDEX[face]
    if(f===undefined) return

    const i = f * 6

    index[i+2] = index[i+4]
    index[i+3] = index[i+0]

  }

  /**
   * 恢复对角线到原始顺序
   * @param {*} index
   * @param {*} face
   * @returns
   */
  static flipTwice(index, face){

    const f = this.FACE_INDEX[face]
    if(f===undefined) return

    const i = f * 6

    index[i+2] = index[i+5]
    index[i+3] = index[i+1]
  }

  /**
   *
   * @param {*} index geometry.index.array
   * @param {string} face 'E','W','U','D','S','N'
   * @param {*} times
   */
  static flip(index, face){

    const flipped = this.isFlipped(index, face)

    if(flipped === null) return

    if(flipped){
      // 已被翻转 → 恢复顺序
      this.flipTwice(index, face)
    }else{
      // 未被翻转 → toggle
      this.flipOnce(index, face)
    }

  }

  /**
   * 判断当前面的对角线是否被翻转，面只能为四边形且index遵循THREE.BoxGeometry的顺序
   *
   * - 默认  ---- 翻转
   * - 0 2 1 ---- 0 1 3
   * - 2 3 1 ---- 0 3 2
   * - 共享边
   * - 2 - 1 ---- 0 - 3
   * @param {*} index geometry.index.array
   * @param {string} face 'E','W','U','D','S','N'
   * @returns
   */
  static isFlipped(index, face){

    const f = this.FACE_INDEX[face]
    const i = f * 6

    //index[i+2] index[i+3]为共享边

    //2-1共享 原样
    if(index[i+2] == index[i+5] && index[i+3] == index[i+1]){
      return false
    }

    //0-3共享 已翻转
    if(index[i+2] == index[i+4] && index[i+3] == index[i+0]){
      return true
    }

    return null
  }

}
