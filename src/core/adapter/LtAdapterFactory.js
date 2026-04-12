import { LT_VERSION } from "../version/LtVersion.js"
import { LtAdapterV_1_12 } from "./LtAdapterV_1_12.js"
import { LtAdapterV_1_21 } from "./LtAdapterV_1_21.js"

export class LtAdapterFactory {

  /**
   *
   * @param {LT_VERSION} version
   * @returns {LtAdapterV_1_12 | LtAdapterV_1_21}
   */
  static create(version) {

    switch (version){
      case LT_VERSION.V_1_12:{
        return LtAdapterV_1_12
      }

      case LT_VERSION.V_1_21:{
        return LtAdapterV_1_21
      }

      default:
        throw new Error(`LtAdapter not found. Unsupported version: ${version}`)
    }

  }
}
