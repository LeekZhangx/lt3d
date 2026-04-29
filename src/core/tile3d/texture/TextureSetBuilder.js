import { TexturePathResolver } from "./resolver/path/TexturePathResolver.js"
import { TextureSet } from "./texset/TextureSet.js"
import { TextureSetType } from "./texset/TextureSetType"


/**
 * 纹理集合构建器
 * 
 * 将 BlockTextureInfoResolver 的输出
 * 转换为渲染可用的纹理结构
 *
 * - 使用 TextureManager 获取 THREE.Texture
 * - 处理单贴图 / 六面贴图
 * - 处理 fallback
 */
export class TextureSetBuilder {

  /**
   * @param {TextureManager} textureManager
   */
  constructor(textureManager) {
    this.textureManager = textureManager
  }

  /**
   * 构建纹理集合
   *
   * @param {Object} info BlockTextureInfoResolver 输出的包含贴图信息的对象
   * @param {TexturePathResolver} pathResolver 对应版本的 TexturePathResolver
   * @returns {TextureSet} 实例对象
   */
  build(info, pathResolver) {

    if (!info) return null
    
    const { type, textures, mod, axis, x, y  } = info

    const texSet = new TextureSet()

    /**
     * 获取纹理对象
     * 
     * 将 纹理信息字符串 转换成对应的 图片文件路径后，生成对应的 THREE.Texture
     * 
     * @param {string} name
     * @returns {THREE.Texture}
     */
    const getTex = (name) => {
      if (!name) return this._fallback()

      const path = pathResolver.resolve(mod, name)
      return this.textureManager.get(path, name)
    }

    /**
     * 处理 #引用
     * 
     * 将带有 # 的纹理位置信息格式化，删除 # 号
     */
    const resolveRef = (key) => {
     let v = textures[key]
      const visited = new Set()

      while (typeof v === 'string' && v.startsWith('#')) {

        const refKey = v.slice(1)

        if (visited.has(refKey)) {
          console.warn('Texture reference loop:', refKey)
          return null
        }

        visited.add(refKey)
        v = textures[refKey]
      }

      return v
    }

    /**
     * 按优先级取纹理
     * 
     * 按照输入的keys，先后取出对应的Texture对象
     */
    const pick = (...keys) => {
      for (const k of keys) {
        const v = resolveRef(k)
        if (v) return getTex(v)
      }
      return this._fallback()
    }

    // =========================
    // 单贴图
    // =========================
    if (type === TextureSetType.SINGLE) {

      const tex = getTex(resolveRef('all'))

      return texSet.setSingle(tex)
    }

    // =========================
    // 多贴图（六面）
    // =========================
    if (type === TextureSetType.MULTIPLE) {

      texSet.setMultiple({
        px: pick('east', 'side', 'all'),
        nx: pick('west', 'side', 'all'),

        pz: pick('south', 'side', 'all'),
        nz: pick('north', 'side', 'all'),

        py: pick('up', 'top', 'end', 'all'),
        ny: pick('down', 'bottom', 'end', 'all')
      })
      
      texSet.applyBlockRotation({ axis, x, y })

      return texSet
    }

    return null
  }

  /**
   * fallback 纹理
   */
  _fallback() {
    return this.textureManager.get(null, '__fallback__')
  }
}