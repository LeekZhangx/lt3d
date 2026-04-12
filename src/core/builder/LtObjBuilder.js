import { VersionDetector } from "../version/VersionDetector.js"
import { ParserRegistry } from "../parser/ParserRegistry.js"
import { TransformRegistry } from "../transformer/TransformRegistry.js"

/**
 * LtObj构建器
 *
 * 可以从txt文本构建ltObj对象
 *
 * 支持Lt版本 1.12 1.21
 */
export class LtObjBuilder {

  /**
   * 从 txt 构建 ltObj 对象
   *
   * 1. txt ---parser---> ast
   * 2. ast --transformer--> ltObj
   *
   * @param {string} txt
   * @param {{}} [options={}]
   */
  static buildFromTxt(txt, options = {}) {

    const version = options.version || VersionDetector.detect(txt)

    options.ltVersion = version

    // -------------
    // --- parse ---
    // -------------
    const parser = ParserRegistry.get(version)

    const astRes = parser.parse(txt, options)

    if(!astRes?.ok) throw astRes

    // console.log(astRes.data);


    // -----------------
    // --- transform ---
    // -----------------
    const transformer = TransformRegistry.get(version)

    const ltObjRes = transformer.transform(astRes.data, options)

    if(!ltObjRes?.ok) throw ltObjRes

    // console.log(ltObjRes.data);

    return ltObjRes.data
  }
}
