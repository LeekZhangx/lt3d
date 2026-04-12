import { BaseError } from '../BaseError.js'
/**
 * TokenizeError 词法分析错误
 *
 * 用于词法分析阶段（Tokenizer）
 *
 * 触发时机：
 *  - 输入文本中存在非法字符
 *  - 字符串未正确闭合
 *  - 内容在 token 尚未完成时意外结束
 *
 * 特点：
 *  - 一定是「语法前」错误
 *  - 无法从 AST 层恢复
 *  - 通常可精确定位到字符位置
 *
 * 示例：
 *  - "abc
 *  - [I;1,2,x]
 */
export class TokenizeError extends BaseError {
  /**
   * @param {string} key
   *   i18n key，例如：
   *   - lt2obj.tokenize.invalid_char
   *   - lt2obj.tokenize.unterminated_string
   *
   * @param {Object} detail
   *   错误占位参数，例如：
   *   - char: 非法字符
   *   - pos:  字符在原始文本中的位置
   */
  constructor(key, detail, path ) {
    super({ key, detail, path })
    this.name = 'TokenizeError'
  }
}
