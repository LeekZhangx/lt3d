import { AstTransformJsonError } from '../../error/stages/AstTransformJsonError'
import { ERROR_KEY } from '../../error/ErrorKey'
import { ElementHandlerV_1_21 } from './handlers/ElementHandlerV_1_21'
import { BaseTransformer } from '../BaseTransformer'

/**
 * ast -> ltObj 转换器
 *
 * LtVersion 1.21
 */
export class TransformerV_1_21 extends BaseTransformer{

  constructor() {
    super()

    this.handlers = {
      t: ElementHandlerV_1_21.parseTiles,
      size: ElementHandlerV_1_21.parseTypedArray,
      min: ElementHandlerV_1_21.parseTypedArray,
      grid: ElementHandlerV_1_21.parseNumberLiteral,
      count: ElementHandlerV_1_21.parseNumberLiteral,
      c: ElementHandlerV_1_21.parseChildren,
      s: ElementHandlerV_1_21.parseStructure,
    }
  }

  _transform(ast, path) {
    if (!ast || ast.type !== 'Object') {
      throw new AstTransformJsonError({
        key: ERROR_KEY.TRANSFORM_AST_INVALID_ROOT,
        detail: { actualType: ast?.type },
        path,
      })
    }

    const result = {}
    const props = ast.properties

    for (const key in props) {
      const node = props[key]
      const handler = this.handlers[key]

      const currentPath = path ? `${path}.${key}` : key

      if (handler) {
        result[key] = handler(node, currentPath, this)
      } else {
        result[key] = ElementHandlerV_1_21.astNodeToJson(node, currentPath)
      }
    }

    return result
  }
}
