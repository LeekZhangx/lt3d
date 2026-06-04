import {LtIR, LtNode, LtStructure, LtTile} from '../ir/LtIR.js'
import { LtAdapter } from './LtAdapter.js'

export class LtAdapterV_1_12 extends LtAdapter{

  /**
   * 将1.12版本的 ltobj转为 供3d化的中间表示
   *
   * @param {Object} ltObj 1.12版本
   * @returns {LtIR}
   */
  toIR(ltObj) {
    const builder = LtIR.builder()
      .grid(ltObj.grid ?? 16)
      .size(ltObj.size || [0, 0, 0])
      .tileCount(ltObj.count ?? 0)
      .tiles(this._parseTiles(ltObj.tiles))

    if (ltObj.structure) {
      builder.structure(this._parseStructure(ltObj.structure))
    }

    if (ltObj.children) {
      builder.children(this._parseChildren(ltObj.children))
    }

    return builder.build()
  }

  /* ========================= node ========================= */

  /**
   * @param {Array} children 
   * @returns {LtNode[]}
   */
  _parseChildren(children) {
    if (!Array.isArray(children)) return []
    return children.map(child => this._parseNode(child))
  }

  /**
   * @param {Object} node 
   * @returns {LtNode}
   */
  _parseNode(node) {
    const builder = LtNode.builder()
      .tiles(this._parseTiles(node.tiles))

    if (node.structure) {
      builder.structure(this._parseStructure(node.structure))
    }

    if (node.children) {
      builder.children(this._parseChildren(node.children))
    }

    return builder.build()
  }

  /* ========================= tiles ========================= */

  /**
   * @param {Array} tArr 
   * @returns {LtTile[]}
   */
  _parseTiles(tArr) {
    if (!Array.isArray(tArr)) return []

    const result = []

    for (const tileGroup of tArr) {
      if (!tileGroup || typeof tileGroup !== 'object') continue

      let boxes

      if (tileGroup.bBox) {
        boxes = [tileGroup.bBox] // 单个box需要包裹一层
      } else {
        boxes = tileGroup.boxes
      }

      const tileBuilder = LtTile.builder()
        .block(tileGroup.tile.block)
        .color(tileGroup.tile.color)
        .boxes(this._parseBoxes(boxes))

      result.push(tileBuilder.build())
    }

    return result
  }

  /* ========================= boxes ========================= */

  /**
   * @param {Array} boxes 
   * @returns {number[][]}
   */
  _parseBoxes(boxes) {
    if (!Array.isArray(boxes)) return []
    return boxes
  }

  /* ========================= structure ========================= */

  /**
   * @param {Object} structure 
   * @returns {LtStructure|undefined}
   */
  _parseStructure(structure) {
    if (!structure) return undefined

    const builder = LtStructure.builder()
      .id(structure.id ?? '')

    if (structure.name) {
      builder.name(structure.name)
    }

    return builder.build()
  }
}
