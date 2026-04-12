import { AstTransformJsonError } from "../error"
import { ERROR_KEY } from "../error/ErrorKey"
import { Result } from "../util/Result"

/**
 * ast -> ltObj 转换器
 *
 * 需要被实现
 */
export class BaseTransformer {

  /**
   * 将 ast 对象转换成 ltObj
   *
   * 需要实现 _transform 方法
   *
   * @param {object} ast Parser解析txt后的对象
   * @param {object} options
   * @returns {object} ltObj
   */
  transform(ast, options) {
    try {
      const result = this._transform(ast)

      result.ltVersion = options.ltVersion

      return Result.ok(result)
    } catch (e) {

      console.error('Unexpected Error:', e)
      console.error('Type:', e.constructor.name)

      if (e instanceof AstTransformJsonError) {
        return Result.err(e.key, {
          ...e.detail,
          path: e.path,
        })
      }

      return Result.err(ERROR_KEY.UNKNOWN_ERROR, {
        message: e?.message,
      })
    }
  }

  _transform(ast) {
    throw new Error("Function _transform must be implemented.")
  }
}
