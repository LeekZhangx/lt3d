import { BaseError } from '../BaseError.js'

/**
 * AstTransformJsonError
 *
 * AST → LT JSON 转换阶段错误
 *
 * 使用场景：
 * - AST 结构正确，但不符合 LT JSON 所需结构
 * - AST 节点类型不支持转换
 * - 必要字段缺失或类型错误
 *
 * 这是“转换错误”，不是语法错误（ParseError），
 * 也不是语义合法性错误（SemanticError）
 */
export class AstTransformJsonError extends BaseError {
  /**
   * @param {string} key
   *   i18n 错误 key，例如：
   *   - lt2json.transform.invalid_root
   *   - lt2json.transform.unsupported_node
   *   - lt2json.transform.missing_field
   *
   * @param {Object} detail
   *   错误详情（用于 i18n 占位）
   *   常见字段示例：
   *   - nodeType: AST 节点类型
   *   - expected: 期望的类型或结构
   *   - actual: 实际的类型或值
   *   - field:   缺失或非法的字段名
   *
   * @param {string} path
   *   AST 路径（用于定位错误位置）
   *   示例：
   *   - 'tiles[0].boxes[2]'
   *   - 'tiles[1].tile.color'
   */
  constructor(key, detail = {}, path = '') {
    super({ key, detail, path })
    this.name = 'AstTransformJsonError'
  }
}
