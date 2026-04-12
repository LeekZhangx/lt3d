export class Result{

  static ok(data) {
    return { ok: true, data }
  }

  static err(errorKey, detail) {
    return { ok: false, errorKey, detail }
  }
}
