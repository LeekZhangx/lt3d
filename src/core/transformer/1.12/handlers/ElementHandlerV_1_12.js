import { AstTransformJsonError } from "../../../error/index.js"
import { ERROR_KEY } from "../../../error/ErrorKey.js"

export class ElementHandlerV_1_12{

  /* ============================================================
  * tiles（强约束解析）
  * ============================================================
  */

  static parseTiles(node, path) {
    if (!node) return []

    if (node.type !== 'Array') {
      throw new AstTransformJsonError(
        ERROR_KEY.TRANSFORM_AST_ARRAY_INVALID_ITEMS,
        { nodeType: node.type },
        path,
      )
    }

    return node.elements.map((el, i) => ElementHandlerV_1_12.parseTileGroup(el, `${path}[${i}]`))
  }

  static parseTileGroup(node, path) {
    if (!node || node.type !== 'Object') {
      throw new AstTransformJsonError(
        ERROR_KEY.TRANSFORM_AST_UNSUPPORTED_NODE,
        { nodeType: node?.type },
        path,
      )
    }

    const props = node.properties
    if (!props || typeof props !== 'object') {
      throw new AstTransformJsonError(
        ERROR_KEY.TRANSFORM_AST_OBJECT_INVALID_PROPERTIES,
        {},
        path,
      )
    }

    const hasBoxes = props.boxes !== undefined
    const hasBBox = props.bBox !== undefined

    // boxes 与 bBox 必须存在其一
    if (!hasBoxes && !hasBBox) {
      throw new AstTransformJsonError(
        ERROR_KEY.TRANSFORM_AST_OBJECT_MISSING_KEY,
        {},
        path,
      )
    }

    // boxes 与 bBox 不能同时存在
    if (hasBoxes && hasBBox) {
      throw new AstTransformJsonError(
        ERROR_KEY.TRANSFORM_AST_OBJECT_INVALID_PROPERTIES,
        {},
        path,
      )
    }

    const result = {
      tile: ElementHandlerV_1_12.parseTile(props.tile, `${path}.tile`),
    }

    if (hasBoxes) {
      result.boxes = ElementHandlerV_1_12.parseBoxes(props.boxes, `${path}.boxes`)
    } else {
      result.bBox = ElementHandlerV_1_12.parseBBox(props.bBox, `${path}.bBox`)
    }

    return result
  }

  /* ============================================================
  * boxes / bBox
  * ============================================================
  */

  static parseBoxes(node, path) {
    if (node.type !== 'Array') {
      throw new AstTransformJsonError(
        ERROR_KEY.TRANSFORM_AST_ARRAY_INVALID_ITEMS,
        { nodeType: node.type },
        path,
      )
    }

    return node.elements.map((el, i) => {
      if (el.type !== 'TypedArray') {
        throw new AstTransformJsonError(
          ERROR_KEY.TRANSFORM_AST_TYPED_ARRAY_INVALID_ITEMS,
          { nodeType: el.type },
          `${path}[${i}]`,
        )
      }
      return el.values || []
    })
  }

  static parseBBox(node, path) {
    if (node.type !== 'TypedArray') {
      throw new AstTransformJsonError(
        ERROR_KEY.TRANSFORM_AST_TYPED_ARRAY_INVALID_ITEMS,
        { nodeType: node.type },
        path,
      )
    }

    return node.values || []
  }

  /* ============================================================
  * tile
  * ============================================================
  */

  static parseTile(node, path) {
    if (!node) return {}

    if (node.type !== 'Object') {
      throw new AstTransformJsonError(
        ERROR_KEY.TRANSFORM_AST_UNSUPPORTED_NODE,
        { nodeType: node.type },
        path,
      )
    }

    const props = node.properties
    if (!props || typeof props !== 'object') {
      throw new AstTransformJsonError(
        ERROR_KEY.TRANSFORM_AST_OBJECT_INVALID_PROPERTIES,
        path,
      )
    }

    return {
      color: ElementHandlerV_1_12.parseNumberLiteral(props.color, `${path}.color`),
      block: ElementHandlerV_1_12.parseString(props.block, `${path}.block`),
    }
  }

  /* ============================================================
  * 通用 AST → JSON（未知字段透传）
  * ============================================================
  */

  /**
   * 通用转换，供未知字段透传
   * @param {*} node
   * @param {*} path
   * @returns
   */
  static astNodeToJson(node, path) {
    if (!node) return null

    switch (node.type) {
      case 'Object': {
        const props = node.properties
        if (!props || typeof props !== 'object') {
          throw new AstTransformJsonError(
            ERROR_KEY.TRANSFORM_AST_OBJECT_INVALID_PROPERTIES,
            {},
            path,
          )
        }

        const obj = {}
        for (const key in props) {
          obj[key] = ElementHandlerV_1_12.astNodeToJson(props[key], `${path}.${key}`)
        }
        return obj
      }

      case 'Array':
        return node.elements.map((el, i) => ElementHandlerV_1_12.astNodeToJson(el, `${path}[${i}]`))

      case 'TypedArray':
        return node.values || []

      case 'NumberLiteral': {
        const raw = node.raw
        if (/^-?\d+$/.test(raw)) return Number(raw)
        return raw
      }

      case 'String':
        return node.value

      case 'BooleanLiteral':
        return node.value

      default:
        throw new AstTransformJsonError(
          ERROR_KEY.TRANSFORM_AST_UNSUPPORTED_NODE,
          { nodeType: node.type },
          path,
        )
    }
  }

  /* ============================================================
  * 基础节点
  * ============================================================
  */

  static parseTypedArray(node, path) {
    if (!node) return null

    if (node.type !== 'TypedArray') {
      throw new AstTransformJsonError(
        ERROR_KEY.TRANSFORM_AST_TYPED_ARRAY_INVALID_ITEMS,
        { nodeType: node.type },
        path,
      )
    }

    return node.values || []
  }

  static parseNumberLiteral(node, path) {
    if (!node) return null

    if (node.type !== 'NumberLiteral') {
      throw new AstTransformJsonError(
        ERROR_KEY.TRANSFORM_AST_NUMBER_INVALID_VALUE,
        { nodeType: node.type },
        path,
      )
    }

    const raw = node.raw
    if (/^-?\d+$/.test(raw)) {
      return Number(raw)
    }
    return raw
  }

  static parseString(node, path) {
    if (!node) return null

    if (node.type !== 'String') {
      throw new AstTransformJsonError(
        ERROR_KEY.TRANSFORM_AST_UNSUPPORTED_NODE,
        { nodeType: node.type },
        path,
      )
    }

    return node.value
  }

}
