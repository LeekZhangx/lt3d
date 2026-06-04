import {LtIR, LtNode, LtStructure, LtTile} from '../ir/LtIR.js'
import { LtAdapter } from './LtAdapter.js'

export class LtAdapterV_1_21 extends LtAdapter{

  /**
   * 将1.21版本的 ltobj转为 供3d化的中间表示
   *
   * @param {Object} ltObj 1.21版本
   * @returns {LtIR}
   */
  toIR(ltObj) {
    const builder = LtIR.builder()
      .grid(ltObj.grid ?? 16)
      .size(ltObj.size || [0, 0, 0])
      .tileCount(ltObj.tiles ?? 0)
      .tiles(this._parseTiles(ltObj.t))

    if (ltObj.s) {
      builder.structure(this._parseStructure(ltObj.s))
    }

    if (ltObj.c) {
      builder.children(this._parseChildren(ltObj.c))
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
      .tiles(this._parseTiles(node.t))

    if (node.s) {
      builder.structure(this._parseStructure(node.s))
    }

    if (node.c) {
      builder.children(this._parseChildren(node.c))
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

      // 1.13后，方块后可能会跟随[facing=north]这样的 方块状态 blockStates
      // 这里不分开，让后续模块处理
      // block和blockStates都保存在block字段中，如 "minecraft:oak_log[axis=y]"

      const tileBuilder = LtTile.builder()
        .block(tileGroup.tile)
        .color(tileGroup.color)
        .boxes(this._parseBoxes(tileGroup.boxes))

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
   * @param {Object} s 
   * @returns {LtStructure|undefined}
   */
  _parseStructure(s) {
    if (!s) return undefined

    const builder = LtStructure.builder()
      .id(s.id ?? '')

    if (s.name) {
      builder.name(s.name)
    }

    return builder.build()
  }
}
