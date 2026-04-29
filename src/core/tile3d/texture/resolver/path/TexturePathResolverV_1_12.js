import { TexturePathResolver } from './TexturePathResolver.js'

/**
 * 纹理路径解析器 v.1.12 
 *
 * 路径规则：
 *   <basePath>/<mod>/blocks/<name>.png
 */
export class TexturePathResolverV_1_12 extends TexturePathResolver {

  /**
   * @override
   */
  resolve(mod, name) {
    if (!mod || !name) return null

    return `${this.basePath}/${mod}/blocks/${name}.png`
  }
}