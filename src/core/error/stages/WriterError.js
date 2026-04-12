import { BaseError } from '../BaseError.js'

/**
 * WriterError
 *
 * 表示在「写出阶段（LtObj → TXT / NBT）」发生的错误。
 *
 * 特点：
 * - 已经通过 AST / Semantic 阶段校验
 * - 输入数据在语义上是“LT 对象”
 * - 但当前 writer 无法将其正确写出为目标格式
 *
 * 常见场景：
 * - 根节点结构非法（不是 Object）
 * - 遇到 writer 不支持的 JS 类型（function / symbol 等）
 * - 数组中包含非法元素
 *
 * 不负责：
 * - 语法错误（ParserError）
 * - 语义解释错误（SemanticError）
 * - 运行时 / Three.js 错误
 *
 * 使用方式：
 * ```js
 * throw new WriterError(
 *   ERROR_KEY.WRITER_INVALID_VALUE_TYPE,
 *   { type: typeof value },
 *   'tiles[0].boxes[3]'
 * )
 * ```
 */
export class WriterError extends BaseError {
  /**
   * @param {object} params
   * @param {string} [params.key]
   *   i18n 对应的错误 key（来自 ERROR_KEY.WRITER_XXX）
   *
   * @param {Object} [params.detail]
   *   错误上下文信息（用于 i18n 插值）
   *
   * @param {string} [params.path]
   *   错误发生的数据路径，例如：
   *   - tiles[0]
   *   - tiles[0].boxes[3]
   */
  constructor(key, detail = {}, path = '') {
    super({key, detail, path})
    this.name = 'WriterError'
  }
}
