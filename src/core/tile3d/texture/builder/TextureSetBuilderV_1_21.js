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
 * TextureSetBuilder 1.21 实现类
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
export class TextureSetBuilderV_1_21 extends TextureSetBuilder{

  /**
   * @param {TextureManager} textureManager
   */
  constructor(textureManager) {
    super(LT_VERSION.V_1_21, textureManager)
  }

  /**
   * 构建纹理集合
   *
   * @param {string} namespace 方块的命名空间
   * @param {BlockTextureInfoResolver} infoResolver 方块纹理贴图信息解析器
   * @param {BlockTypeResolver} blockTypeResolver 方块纹理布局信息解析器
   * @param {TexturePathResolver} pathResolver 纹理路径解析器
   * @returns {TextureSet} 实例对象
   */
  build(namespace, infoResolver, blockTypeResolver, pathResolver) {

    /**
     * 方块命名空间 如 minecraft:stone
     */
    let blockName = null
    /**
     * 方块状态信息，包含 轴axis 朝向facing 等
     */
    let blockStates = null

    const lastOpen = namespace.lastIndexOf('[')
    const lastClose = namespace.lastIndexOf(']')

    if (lastOpen === -1 || lastClose === -1 || lastClose < lastOpen) {

      blockName = namespace

    }else{

      blockName =  namespace.slice(0, lastOpen)
      const statesStr =  namespace.slice(lastOpen + 1, lastClose)
      blockStates = this._parseAttributeStr(statesStr)
    }

    // 没有找寻到对应的path，也将null传递给textureManager，让其使用默认材质
    const blockInfo = infoResolver.resolve(blockName)
    
    if (!blockInfo) return null
    
    //这里的type是贴图类型，不是方块类型
    const { textureSetType, textures, mod } = blockInfo

    const texSet = new TextureSet()

    /**
     * 获取纹理对象
     * 
     * 将 纹理信息字符串 转换成对应的 图片文件路径后，生成对应的 THREE.Texture
     * 
     * @param {string} name 
     * 方块名称，
     * 这里可能为 block/dried_kelp_bottom ，
     * 也可能为携带 mod 前缀 minecraft:block/bone_block_top
     * 
     * @returns {THREE.Texture}
     */
    const getTex = (name) => {
      if (!name) return this._fallback()
 
      // 单贴图的 name 为去除 mod 的方块名称，如 stone
      // 多贴图的 name 为解析出的字符串，如 minecraft:block/grass_top
      const res = this._parseBlockStr(name)
      
      const path = pathResolver.resolve(res.mod ?? mod, res.block)
      
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

      // 处理复杂的带模板的纹理贴图
      if(blockInfo.textures.pattern){

        const template = this._parseBlockStr(blockInfo.parent).block

        rotates = blockTypeResolver.resolve(template) 
      }
      
      
      
      
      // 面 贴图旋转

      const faces = new TextureFaces({
        px: new TextureFace(
          pick('east', 'side', 'all', 'pattern'), 
          rotates.east
        ),
        nx: new TextureFace(
          pick('west', 'side', 'all', 'pattern'), 
          rotates.west
        ),

        pz: new TextureFace(
          pick('south', 'front', 'side', 'all', 'pattern'), 
          rotates.south
        ),
        nz: new TextureFace(
          pick('north', 'side', 'all', 'pattern'), 
          rotates.north
        ),

        py: new TextureFace(
          pick('up', 'top', 'end', 'all', 'pattern'), 
          rotates.up
        ),
        ny: new TextureFace(
          pick('down', 'bottom', 'end', 'top', 'all', 'pattern'), 
          rotates.down
        )

      })

      texSet.setMultiple(faces)

      // 方块整体 切换轴向和轴旋转

      let axis = null
      let x = 0, y = 0

      if(blockStates){

        axis = blockStates.axis ?? null

        let facing = blockStates.facing

        switch(facing){
          case 'north':
            y = 180
            break;
          case 'south':
            y = 0
            break;
          case 'east':
            y = 90
            break;
          case 'west':
            y = 270
            break;
        }

      }
      
      texSet.applyBlockRotation({ axis, x, y })

      return texSet
    }

    return null
  }

  /**
   * 将等号键值对字符串转换为对象
   * 
   * @param {string} str 
   * @returns 
   */
  _parseAttributeStr(str) {
    const result = {};
    
    // 按空格分割字符串
    const parts = str.trim().split(/\s+/);
    
    for (const part of parts) {
      // 按等号分割键值对
      const [key, value] = part.split('=');
      
      if (key && value !== undefined) {
        // 尝试将值转换为数字（如果是数字格式）
        const numValue = Number(value);
        result[key] = isNaN(numValue) ? value : numValue;
      } else if (key) {
        // 处理没有等号的情况（可选）
        result[key] = true;
      }
    }
    
    return result;
  }

  /**
   * 用于处理 1.21 BlockTextureTable 中的贴图文件路径
   * 
   * 字符串可能为格式 minecraft:block/bone_block_top 或 block/dried_kelp_bottom
   * 
   * @param {string} str 
   * @returns {object} { mod, block } 对象
   */
  _parseBlockStr(str) {
    
    // 检查是否包含 :block/
    if (str.includes(':block/')) {
      const [mod, rest] = str.split(':block/');
      if (mod && rest) {
        return { mod: mod, block: rest };
      }
    }
    
    // 检查是否以 block/ 开头
    if (str.startsWith('block/')) {
      const block = str.substring(6); // 截取后部
      return { mod: null, block: block };
    }
    
    return { mod: null, block: str };
  }
}