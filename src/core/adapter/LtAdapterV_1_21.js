import '../ir/lt-ir.js'

export class LtAdapterV_1_21 {

  /**
   * 将1.21版本的 ltobj转为 供3d化的中间表示
   *
   * @param {Object} ltObj 1.21版本
   * @returns {LtIR}
   */
  static toIR(ltObj) {

    const res = {
      grid: ltObj.grid ?? 16,
      size: ltObj.size || [0, 0, 0],
      tileCount: ltObj.tiles ?? 0,
      tiles: this._parseTiles(ltObj.t),
    }

    if(ltObj.s){
      res.structure = this._parseStructure(ltObj.s)
    }

    if(ltObj.c){
      res.children = this._parseChildren(ltObj.c)
    }

    return res
  }

  /* ========================= node ========================= */

  static _parseChildren(children) {
    if (!Array.isArray(children)) return []

    return children.map(child => this._parseNode(child))
  }

  static _parseNode(node) {

    const res = {
      tiles: this._parseTiles(node.t)
    }

    if(node.s){
      res.structure = this._parseStructure(node.s)
    }

    if(node.c){
      res.children = this._parseChildren(node.c)
    }

    return res
  }

  /* ========================= tiles ========================= */

  static _parseTiles(tArr) {
    if (!Array.isArray(tArr)) return []

    const result = []

    for (const tileGroup of tArr) {

      if (!tileGroup || typeof tileGroup !== 'object') continue

      //1.13后，方块后可能会跟随[facing=north]这样的 方块状态 blockStates
      //需要分离开
      const str = tileGroup.tile

      let block = null, blockStates = null

      const lastOpen = str.lastIndexOf('[')
      const lastClose = str.lastIndexOf(']')

      if (lastOpen === -1 || lastClose === -1 || lastClose < lastOpen) {

        block = str

      }else{

        block =  str.slice(0, lastOpen),
        blockStates =  str.slice(lastOpen + 1, lastClose)

      }

      const res = {
        block: block,
        color: tileGroup.color,
        boxes: this._parseBoxes(tileGroup.boxes)
      }

      if(blockStates){
        res.blockStates = blockStates
      }

      result.push(res)
    }

    return result
  }

  /* ========================= boxes ========================= */

  static _parseBoxes(boxes) {
    if (!Array.isArray(boxes)) return []

    return boxes
  }


  /* ========================= structure ========================= */

  static _parseStructure(s) {
    if (!s) return undefined

    const res = {
      id: s.id
    }

    if(s.name){
      res.name = s.name
    }

    return res
  }

}
