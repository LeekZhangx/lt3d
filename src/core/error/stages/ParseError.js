import { BaseError } from '../BaseError'
/**
 * ParseError 语法分析错误
 *
 * 用于语法分析阶段（Parser）
 *
 * 触发时机：
 *  - token 顺序不符合语法规则
 *  - 期望某种 token，但实际得到另一种
 *  - 输入在结构尚未完成时提前结束
 *
 * 特点：
 *  - 已通过词法分析
 *  - token 本身是合法的
 *  - 但 token 组合不符合 LT 语法
 *
 * 示例：
 *  - { a: 1, }
 *  - [I;1,2,]
 *  - { tiles: [ }
 */
export class ParseError extends BaseError {

  /**
   * @param {string} key
   *   i18n key，例如：
   *   - lt2obj.parser.expected_token
   *   - lt2obj.parser.unexpected_token
   *
   * @param {Object} detail
   *   错误占位参数，例如：
   *   - expected: 期望的 token 类型
   *   - got:      实际的 token 类型
   *   - pos:      token 在原始文本中的位置
   */
  constructor(key, detail, path ) {
    super({ key, detail, path })
    this.name = 'ParseError'
  }
}
