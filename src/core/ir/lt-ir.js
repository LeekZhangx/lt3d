/**
 * ===============================
 * LT Intermediate Representation
 *
 * 统一不同版本的ltObj格式
 * ===============================
 */

/**
 * @typedef {Object} LtIR
 * @property {number} grid 网格大小
 * @property {[number, number, number]} size
 * @property {number} tileCount 1.12的count/ 1.21的tiles
 * @property {IRTile[]} tiles
 * @property {IRStructure=} structure 结构类型
 * @property {IRNode[]=} children
 */

/**
 * @typedef {Object} IRNode
 * @property {IRTile[]} tiles
 * @property {IRStructure=} structure
 * @property {IRNode[]=} children
 */

/**
 * @typedef {Object} IRTile
 * @property {string} block 完整的名称字符串
 *  - 1.12 "minecraft:wool:5"
 *  - 1.21 "minecraft:green_wool"
 * @property {string} blockInfo 方块附属信息，从原方块名称中分离. 不是元数据
 *  - 如"[facing=north]"
 * @property {number=} color 未解析的十进制数
 * @property {number[]} boxes [x1,y1,z1, x2,y2,z2, mask?, ex0,ex1...]
 */

/**
 * @typedef {Object} IRStructure
 * @property {string} id
 * @property {string=} name
 */
