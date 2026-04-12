import { AstTransformJsonError } from '../../../error/stages/AstTransformJsonError.js'
import { ERROR_KEY } from '../../../error/ErrorKey.js'

export class ElementHandlerV_1_21 {

  /**
   * t: tiles
   */
  static parseTiles(node, path) {
    if (node.type !== 'Object') {
      throw new AstTransformJsonError(
        ERROR_KEY.TRANSFORM_AST_OBJECT_INVALID,
        '',
        path,
      )
    }

    const result = []

    for (const blockId in node.properties) {
      const arrNode = node.properties[blockId]

      if (arrNode.type !== 'Array') {
        throw new AstTransformJsonError(
          ERROR_KEY.TRANSFORM_AST_ARRAY_INVALID,
          '',
          `${path}.${blockId}`,
        )
      }

      const elements = arrNode.elements
      if (!elements.length) continue

      let currentColor = null
      let currentBoxes = []

      /**
       * 处理color和tile混合的流数据
       * @returns
       */
      const flush = () => {
        if (currentColor === null || currentBoxes.length === 0) return

        result.push({
          tile: blockId,
          color: currentColor,
          boxes: currentBoxes,
        })

        currentBoxes = []
      }

      elements.forEach((el, i) => {
        const arr = ElementHandlerV_1_21.parseIntArray(
          el,
          `${path}.${blockId}[${i}]`
        )

        // 判断：color（单值数组）
        if (arr.length === 1) {
          // 切换颜色前，先提交之前的数据
          flush()

          currentColor = arr[0]
          return
        }

        // box（>=6）
        if (arr.length >= 6) {
          currentBoxes.push(arr)
          return
        }

        // 异常数据
        throw new AstTransformJsonError(
          ERROR_KEY.TRANSFORM_AST_ARRAY_INVALID_ITEMS,
          { length: arr.length },
          `${path}.${blockId}[${i}]`
        )
      })

      // 最后一个 tile
      flush()
    }

    return result
  }

  /**
   * c: children
   */
  static parseChildren(node, path, ctx) {
    if (node.type !== 'Array') {
      throw new AstTransformJsonError(
        ERROR_KEY.TRANSFORM_AST_ARRAY_INVALID,
        '',
        path,
      )
    }

    return node.elements.map((el, i) =>
      ctx._transform(el, `${path}[${i}]`)
    )
  }

  /**
   * s: structure
   */
  static parseStructure(node, path) {
    return ElementHandlerV_1_21.astNodeToJson(node, path)
  }

  /**
   * [I;...] → number[]
   */
  static parseTypedArray(node, path) {
    return ElementHandlerV_1_21.parseIntArray(node, path)
  }

  static parseIntArray(node, path) {
    if (node.type !== 'TypedArray') {
      throw new AstTransformJsonError(
        ERROR_KEY.TRANSFORM_AST_TYPED_ARRAY_INVALID,
        '',
        path,
      )
    }

    return node.values
  }

  /**
   * number literal
   */
  static parseNumberLiteral(node, path) {
    if (node.type !== 'NumberLiteral') {
      throw new AstTransformJsonError(
        ERROR_KEY.TRANSFORM_AST_NUMBER_INVALID_VALUE,
        '',
        path,
      )
    }

    const raw = node.raw
    if (/^-?\d+$/.test(raw)) {
      return Number(raw)
    }
    return raw

  }

  /**
   * fallback: AST → JSON
   */
  static astNodeToJson(node, path) {
    switch (node.type) {
      case 'Object': {
        const obj = {}
        for (const k in node.properties) {
          obj[k] = ElementHandlerV_1_21.astNodeToJson(node.properties[k], `${path}.${k}`)
        }
        return obj
      }

      case 'Array':
        return node.elements.map((el, i) =>
          ElementHandlerV_1_21.astNodeToJson(el, `${path}[${i}]`)
        )

      case 'TypedArray':
        return node.values


      case 'NumberLiteral': {
        const raw = node.raw
        if (/^-?\d+$/.test(raw)) return Number(raw)
        return raw
        }

      case 'String':
      case 'BooleanLiteral':
        return node.value

      default:
        throw new AstTransformJsonError(
          ERROR_KEY.TRANSFORM_AST_UNSUPPORTED_NODE,
          { type: node.type },
          path,
        )
    }
  }
}
