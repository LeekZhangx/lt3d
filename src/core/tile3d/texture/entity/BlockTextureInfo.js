import { TextureSetType } from "../texset/TextureSetType"

/**
 * 方块贴图信息 实体类
 * 
 * 用于存放方块各面贴图的信息，只作为中间数据
 */
export class BlockTextureInfo{

  constructor(){
    /**
     * @type {keyof typeof TextureSetType} 方块的纹理贴图类型
     */ 
    this.textureSetType = null

    /**
     * @type {string} mod名称
     */
    this.mod = null

    /**
     * @type {string} 该方块属于的贴图类型
     */
    this.parent = null

    /**
     * @type {object} 纹理信息数据，描述的方块各个面的纹理情况
     */
    this.textures = null

    /**
     * @type {string} 旋转轴，只供柱状方块使用，用于变换纹理方向
     */
    this.axis = null

    /**
     * @type {number} 绕x轴旋转角度
     */
    this.x = null

    /**
     * @type {number} 绕y轴旋转角度
     */
    this.y = null
  }


}