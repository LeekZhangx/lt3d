import '../ir/lt-ir.js'

export class LtAdapterV_1_12 {

  /**
   * 将1.12版本的 ltobj转为 供3d化的中间表示
   *
   * @param {Object} ltObj 1.12版本
   * @returns {LtIR}
   */
  static toIR(ltObj) {

    const res = {
      grid: ltObj.grid ?? 16,
      size: ltObj.size || [0, 0, 0],
      tileCount: ltObj.count ?? 0,
      tiles: this._parseTiles(ltObj.tiles),
    }

    if(ltObj.structure){
      res.structure = this._parseStructure(ltObj.structure)
    }

    if(ltObj.children){
      res.children = this._parseChildren(ltObj.children)
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
      tiles: this._parseTiles(node.tiles)
    }

    if(node.structure){
      res.structure = this._parseStructure(node.structure)
    }

    if(node.children){
      res.children = this._parseChildren(node.children)
    }

    return res
  }

  /* ========================= tiles ========================= */

  static _parseTiles(tArr) {
    if (!Array.isArray(tArr)) return []

    const result = []

    for (const tileGroup of tArr) {

      if (!tileGroup || typeof tileGroup !== 'object') continue

      let boxes

      if(tileGroup.bBox){
        boxes = [tileGroup.bBox] //单个box需要包裹一层
      }else{
        boxes = tileGroup.boxes
      }

      result.push({
        block: tileGroup.tile.block,
        color: tileGroup.tile.color,
        boxes: this._parseBoxes(boxes)
      })
    }

    return result
  }

  /* ========================= boxes ========================= */

  static _parseBoxes(boxes) {
    if (!Array.isArray(boxes)) return []

    return boxes
  }


  /* ========================= structure ========================= */

  static _parseStructure(structure) {
    if (!structure) return undefined

    const res = {
      id: structure.id
    }

    if(structure.name){
      res.name = structure.name
    }

    return res
  }

}
