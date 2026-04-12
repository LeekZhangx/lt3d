import { LT_VERSION } from "./LtVersion"

export class VersionDetector {


  static detect(txt) {

    if (txt.includes('tile:{')) return LT_VERSION.V_1_12

    if (txt.includes('t:{')) return LT_VERSION.V_1_21

    return LT_VERSION.V_1_12
  }
}
