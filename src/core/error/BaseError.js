export class BaseError extends Error {
  constructor({ key, detail = {}, path = '' }) {
    super(key)
    this.name = this.constructor.name

    /** i18n key */
    this.key = key

    /** 业务上下文数据（唯一参数来源） */
    this.detail = detail

    /** 数据路径，如 tiles[0].boxes[3] */
    this.path = path
  }

  toResult() {
    return {
      ok: false,
      errorKey: this.key,
      detail: {
        ...this.detail,
        path: this.path,
      },
    }
  }
}
