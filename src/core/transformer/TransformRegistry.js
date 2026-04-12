import { LT_VERSION } from '../version/LtVersion'
import { TransformerV_1_21 } from './1.21/TransformerV_1_21'
import { TransformerV_1_12 } from './1.12/TransformerV_1_12'
import { BaseTransformer } from './BaseTransformer'


const registry = {
  [LT_VERSION.V_1_12]: () => new TransformerV_1_12(),
  [LT_VERSION.V_1_21]: () => new TransformerV_1_21(),
}

/**
 * lt ast对象转为 lt obj对象 的不同版本转换器 的注册表
 */
export class TransformRegistry {

  /**
   *
   * @param {LT_VERSION} version
   * @returns {BaseTransformer}
   */
  static get(version) {
    const transformer = registry[version]

    if (!transformer) {
      throw new Error(`Transformer not found for version: ${version}`)
    }

    return transformer()
  }
}
