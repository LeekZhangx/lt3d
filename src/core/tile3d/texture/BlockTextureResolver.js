export class BlockTextureResolver {

  /**
   * @param {object} table BLOCK_TEXTURE_TABLE（按版本加载）
   * @param {string} basePath 贴图根路径
   */
  constructor(table, basePath) {

    if (new.target === BlockTextureResolver) {
      throw new Error("BlockTextureResolver cannot be instantiated.")
    }

    /**
     * @type {object} BLOCK_TEXTURE_TABLE 方块名称与材质贴图映射表
     */
    this.table = table

    /**
     * @type {string} 贴图根路径，不同的版本贴图路径不同
     */
    this.basePath = basePath
  }

  /**
   * 解析 block namespace 对应的贴图路径
   *
   * @param {string} namespace    如 "minecraft:stone:2" / "littletiles:ltcoloredblock"
   * @returns {string|null} 完整的路径 basePath/blocks/stone.png
   */
  resolve(namespace) {
    throw new Error('Must implement function resolve(namespace).');
  }

}

