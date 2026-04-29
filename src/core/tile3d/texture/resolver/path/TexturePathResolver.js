import { LT_VERSION } from "../../../../version/LtVersion.js"

/**
 * 纹理路径解析器（抽象基类）
 *
 * - 根据 根路径 + mod + 纹理名称，生成最终资源路径
 * - 不同版本生成的路径规则不同
 * 
 * @abstract
 */
export class TexturePathResolver {

  /**
   * 
   * @param {keyof typeof LT_VERSION} ltVersion 
   * @param {string} basePath 加载纹理资源的根路径
   */
  constructor(ltVersion, basePath) {

    if (new.target === TexturePathResolver) {
      throw new Error("TexturePathResolver cannot be instantiated.")
    }

    this.ltVersion = ltVersion
    this.basePath = basePath
  }

  /**
   * 解析纹理路径
   *
   * @param {string} mod 模组名称（如 minecraft）
   * @param {string} name 纹理名（如 grass_top）
   *  - 不携带路径前缀和文件类型后缀
   * @returns {string|null} 完整路径
   */
  resolve(mod, name) {
    throw new Error('TexturePathResolver.resolve() must be implemented')
  }
}