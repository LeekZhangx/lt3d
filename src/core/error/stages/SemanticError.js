import { BaseError } from '../BaseError.js'
/**
 * SemanticError 语义错误
 *
 * 用于 AST → 业务对象阶段的语义错误
 * - 不属于语法错误
 * - 不属于词法错误
 * - 表示 AST 结构或语义不符合业务约定
 */
export class SemanticError extends BaseError {
  /**
   * @param {object} params
   * @param {string} [params.key] i18n key（如 lt2obj.semantic.invalid_root）
   * @param {Object} [params.detail]  占位符参数
   */
  constructor({ key, detail, path }) {
    super({ key, detail, path })
    this.name = 'SemanticError'
  }
}
