import { LT_VERSION } from "../../version/LtVersion"

export class BlockTextureResolver {

  /**
   * @param {keyof typeof LT_VERSION} ltVersion lt版本
   * @param {object[]} tables BLOCK_TEXTURE_TABLE（按版本加载）
   * @param {string} basePath 纹理根路径
   */
  constructor(ltVersion, tables, basePath) {

    if (new.target === BlockTextureResolver) {
      throw new Error("BlockTextureResolver cannot be instantiated.")
    }

    this.ltVersion = ltVersion

    /**
     * @type {Array<object>} 多层 table（按优先级从高到低）方块名称与材质纹理映射表
     */
    this.tables = tables || []
    
    /**
     * @type {string} 纹理根路径，不同的版本纹理路径不同
     */
    this.basePath = basePath

    /**
     * 合并后的索引表
     */
    this.mergedTable = {
      mods: {}
    }

    this._mergeTables()
  }

  /**
   * 注册新的 table（默认最高优先级）
   */
  registerTable(table, { priority = 'high' } = {}) {
    if (!table || !table.mods) return

    if (priority === 'high') {
      this.tables.unshift(table)
    } else {
      this.tables.push(table)
    }

    this._mergeTables()
  }

  /**
   * 合并tables
   */
  _mergeTables() {
    const result = {}

    // 从低优先级 → 高优先级（保证覆盖）
    for (let i = this.tables.length - 1; i >= 0; i--) {
      const table = this.tables[i]

      for (const mod in table.mods) {
        if (!result[mod]) {
          result[mod] = {}
        }

        Object.assign(result[mod], table.mods[mod])
      }
    }

    this.mergedTable.mods = result
  }

  /**
   * 清空用户扩展
   */
  clearTables() {
    this.tables = []
  }

  /**
   * 解析 block namespace 对应的纹理路径
   *
   * @param {string} namespace    如 "minecraft:stone:2" / "littletiles:ltcoloredblock"
   * @returns {string|null} 完整的路径 basePath/blocks/stone.png
   */
  resolve(namespace) {
    throw new Error('Must implement function resolve(namespace).');
  }

}

