import { AstTransformJsonError } from '../../error/stages/AstTransformJsonError.js'
import { ERROR_KEY } from '../../error/ErrorKey.js'
import { ElementHandlerV_1_12 } from './handlers/ElementHandlerV_1_12.js'
import { BaseTransformer } from '../BaseTransformer.js'

/**
 * ast -> ltObj 转换器
 *
 * LtVersion 1.12
 */
export class TransformerV_1_12 extends BaseTransformer{

  constructor() {
    super()

    /**
     * key → handler
     * handler(node, path, ctx)
     */
    this.handlers = {
      tiles: ElementHandlerV_1_12.parseTiles,
      size: ElementHandlerV_1_12.parseTypedArray,
      min: ElementHandlerV_1_12.parseTypedArray,
      grid: ElementHandlerV_1_12.parseNumberLiteral,
      count: ElementHandlerV_1_12.parseNumberLiteral,
    }
  }

  /**
   * 将ast对象转换为lt对象
   * @param {Object} ast
   */
  _transform(ast){

    // 根节点必须是 Object
    if (!ast || ast.type !== 'Object') {
      throw new AstTransformJsonError({
        key: ERROR_KEY.TRANSFORM_AST_INVALID_ROOT,
        detail: { actualType: ast?.type },
        path: '',
      })
    }

    const props = ast.properties
    if (!props || typeof props !== 'object') {
      throw new AstTransformJsonError({
        key: ERROR_KEY.TRANSFORM_AST_OBJECT_INVALID_PROPERTIES,
        path: '',
      })
    }

    const result = {}

    // 顶层字段：已知 / 未知 分流
    for (const key in props) {
      const node = props[key]

      const handler = this.handlers[key]

      if (handler) {
        result[key] = handler(node, key)
      } else {
        result[key] = this._fallbackHandler(node, key)
      }
    }

    return result
  }

  /**
   * fallback：未知字段透传
   */
  _fallbackHandler(node, path) {
    return ElementHandlerV_1_12.astNodeToJson(node, path)
  }


}
