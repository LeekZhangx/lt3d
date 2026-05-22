import {TextureSetBuilder} from "./TextureSetBuilder.js"
import { LT_VERSION } from "../../../version/LtVersion.js"
import { BlockTextureInfoResolver } from "../resolver/info/BlockTextureInfoResolver.js"
import { TexturePathResolver } from "../resolver/path/TexturePathResolver.js"
import { BlockTypeResolver } from "../resolver/type/BlockTypeResolver.js"
import { TextureFace } from "../texset/TextureFace.js"
import { TextureFaces } from "../texset/TextureFaces.js"
import { TextureSet } from "../texset/TextureSet.js"
import { TextureSetType } from "../texset/TextureSetType.js"


/**
 * TextureSetBuilder 1.12 实现类
 * 
 * 纹理集合构建器
 * 
 * 将 BlockTextureInfoResolver 的输出
 * 转换为渲染可用的纹理结构
 *
 * - 使用 TextureManager 获取 THREE.Texture
 * - 处理单贴图 / 六面贴图
 * - 处理 fallback
 */
export class TextureSetBuilderV_1_12 extends TextureSetBuilder{

  /**
   * @param {TextureManager} textureManager
   */
  constructor(textureManager) {
    super(LT_VERSION.V_1_12, textureManager)
  }

  /**
   * 构建纹理集合
   *
   * @param {string} namespace 方块的命名空间
   * @param {BlockTextureInfoResolver} infoResolver 对应版本的 BlockTextureInfoResolver
   * @param {BlockTypeResolver} blockTypeResolver 对应版本的 BlockTypeResolver
   * @param {TexturePathResolver} pathResolver 对应版本的 TexturePathResolver
   * @returns {TextureSet} 实例对象
   */
  build(namespace, infoResolver, blockTypeResolver, pathResolver) {

    // 没有找寻到对应的path，也将null传递给textureManager，让其使用默认材质
    const blockInfo = infoResolver.resolve(namespace)

    if (!blockInfo) return null
    
    //这里的type是贴图类型，不是方块类型
    const { textureSetType, textures, mod, axis, x, y  } = blockInfo

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
     * 按优先级取纹理
     * 
     * 按照输入的keys，先后取出对应的Texture对象
     */
    const pick = (...keys) => {
      for (const k of keys) {
        const v = textures[k]
        if (v) return getTex(v)
      }
      return this._fallback()
    }

    // =========================
    // 单贴图
    // =========================
    if (textureSetType === TextureSetType.SINGLE) {

      const tex = getTex(textures["all"])

      return texSet.setSingle(tex)
    }

    // =========================
    // 多贴图（六面）
    // =========================
    if (textureSetType === TextureSetType.MULTIPLE) {

      let rotates = {
        "up":   0,
        "down": 0,
        "north":  0,
        "south": 0,
        "west":  0,
        "east": 0,
      }
      
      if(blockInfo.blockType){
        rotates = blockTypeResolver.resolve(blockInfo.blockType)   
      }

      const faces = new TextureFaces({
        px: new TextureFace(
          pick('east', 'side', 'all'), 
          rotates.east
        ),
        nx: new TextureFace(
          pick('west', 'side', 'all'), 
          rotates.west
        ),

        pz: new TextureFace(
          pick('south', 'front', 'side', 'all'), 
          rotates.south
        ),
        nz: new TextureFace(
          pick('north', 'side', 'all'), 
          rotates.north
        ),

        py: new TextureFace(
          pick('up', 'top', 'end', 'all'), 
          rotates.up
        ),
        ny: new TextureFace(
          pick('down', 'bottom', 'end', 'top', 'all'), 
          rotates.down
        )

      })

      texSet.setMultiple(faces)
      
      texSet.applyBlockRotation({ axis, x, y })

      return texSet
    }

    return null
  }

}