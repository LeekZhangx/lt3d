import { LT_VERSION } from '../../../../version/LtVersion.js'
import { TexturePathResolver } from './TexturePathResolver.js'

/**
 * TexturePathResolver 1.12 实现类
 * 
 * 纹理路径解析器 
 *
 * 路径规则：
 *   <basePath>/<mod>/blocks/<name>.png
 */
export class TexturePathResolverV_1_12 extends TexturePathResolver {

  /**
   * 
   * @param {string} basePath 加载纹理资源的根路径
   */
  constructor(basePath) {
    super(LT_VERSION.V_1_12, basePath)
  }

  /**
   * @override
   */
  resolve(mod, name) {
    if (!mod || !name) return null

    return `${this.basePath}/${mod}/blocks/${name}.png`
  }
}