export class LtColor{
  /**
   * Java int RGB 转换为 { a, r, g, b }
   * @param {number} color Java int 颜色值
   * @returns {{a: number, r:number, g:number, b:number} | null}
   */
  static intColorToRGB(color) {
    if (typeof color !== 'number') return null

    //转无符号
    const c = color >>> 0

    return {
      a: (c >> 24) & 0xff,
      r: (c >> 16) & 0xff,
      g: (c >> 8) & 0xff,
      b: c & 0xff,
    }
  }
}
