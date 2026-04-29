import { TexturePathResolver } from './TexturePathResolver.js'

/**
 * 纹理路径解析器 v.1.21
 *
 * 路径规则：
 *   <basePath>/<mod>/block/<name>.png
 */
export class TexturePathResolverV_1_21 extends TexturePathResolver {

  /**
   * @override
   */
  resolve(mod, name) {
    if (!mod || !name) return null

    return `${this.basePath}/${mod}/block/${name}.png`
  }
}