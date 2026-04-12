import { LT_VERSION } from '../version/LtVersion'
import { BaseParser } from './BaseParser'

const registry = {
  [LT_VERSION.V_1_12]: BaseParser,
  [LT_VERSION.V_1_21]: BaseParser,
}

/**
 * lt txt解析器 注册表
 *
 * 都是NBT标签，解析区别不大，都使用 BaseParser 解析
 */
export class ParserRegistry {

  /**
   *
   * @param {LT_VERSION} version
   * @returns {BaseParser}
   */
  static get(version) {
    const Parser = registry[version]

    if (!Parser) {
      throw new Error(`Parser not found for version: ${version}`)
    }

    return Parser
  }
}
