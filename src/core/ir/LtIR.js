/**
 * 轻量级中间表示（Lightweight Intermediate Representation）主类
 * 用于存储和构建Lt的层次化数据结构
 */
class LtIR {
  constructor() {
    /** @type {number} 网格大小，默认为16 */
    this.grid = 16;
    /** @type {[number, number, number]} 整体尺寸 [x, y, z] */
    this.size = [0, 0, 0];
    /** @type {number} tile总数（1.12的count/1.21的tiles） */
    this.tileCount = 0;
    /** @type {LtTile[]} 顶层tile数组 */
    this.tiles = [];
    /** @type {LtStructure|null} 结构类型信息 */
    this.structure = null;
    /** @type {LtNode[]} 子节点数组，用于层次化结构 */
    this.children = [];
  }

  /**
   * 创建LtIR的构建器实例
   * @returns {LtIRBuilder} 新的构建器实例
   */
  static builder() {
    return new LtIRBuilder();
  }

  /**
   * 从现有数据构建实例（工厂方法）
   * @param {Object} data - 原始数据对象
   * @returns {LtIR} 新的LtIR实例
   */
  static fromData(data) {
    const builder = LtIR.builder();
    if (data.grid) builder.grid(data.grid);
    if (data.size) builder.size(data.size);
    if (data.tileCount) builder.tileCount(data.tileCount);
    if (data.tiles) builder.tiles(data.tiles.map(tile => LtTile.fromData(tile)));
    if (data.structure) builder.structure(LtStructure.fromData(data.structure));
    if (data.children) builder.children(data.children.map(child => LtNode.fromData(child)));
    return builder.build();
  }
}

/**
 * LtIR构建器类（Builder模式）
 * 提供链式调用的API来构建LtIR实例
 */
class LtIRBuilder {
  constructor() {
    /** @private @type {LtIR} */
    this.ir = new LtIR();
  }

  /**
   * 设置网格大小
   * @param {number} grid - 网格大小
   * @returns {LtIRBuilder} 当前构建器实例（支持链式调用）
   */
  grid(grid) {
    this.ir.grid = grid;
    return this;
  }

  /**
   * 设置整体尺寸
   * @param {[number, number, number]} size - [宽度, 高度, 深度]
   * @returns {LtIRBuilder} 当前构建器实例（支持链式调用）
   */
  size(size) {
    this.ir.size = size;
    return this;
  }

  /**
   * 设置tile总数
   * @param {number} tileCount - tile数量
   * @returns {LtIRBuilder} 当前构建器实例（支持链式调用）
   */
  tileCount(tileCount) {
    this.ir.tileCount = tileCount;
    return this;
  }

  /**
   * 设置tile数组
   * @param {LtTile[]} tiles - tile数组
   * @returns {LtIRBuilder} 当前构建器实例（支持链式调用）
   */
  tiles(tiles) {
    this.ir.tiles = tiles;
    return this;
  }

  /**
   * 添加单个tile
   * @param {LtTile} tile - 单个tile
   * @returns {LtIRBuilder} 当前构建器实例（支持链式调用）
   */
  addTile(tile) {
    this.ir.tiles.push(tile);
    this.ir.tileCount = this.ir.tiles.length;
    return this;
  }

  /**
   * 设置结构信息
   * @param {LtStructure} structure - 结构对象
   * @returns {LtIRBuilder} 当前构建器实例（支持链式调用）
   */
  structure(structure) {
    this.ir.structure = structure;
    return this;
  }

  /**
   * 设置子节点数组
   * @param {LtNode[]} children - 子节点数组
   * @returns {LtIRBuilder} 当前构建器实例（支持链式调用）
   */
  children(children) {
    this.ir.children = children;
    return this;
  }

  /**
   * 添加单个子节点
   * @param {LtNode} child - 单个子节点
   * @returns {LtIRBuilder} 当前构建器实例（支持链式调用）
   */
  addChild(child) {
    this.ir.children.push(child);
    return this;
  }

  /**
   * 构建最终的LtIR实例
   * @returns {LtIR} 构建完成的LtIR实例
   */
  build() {
    return this.ir;
  }
}

/**
 * LT节点类，用于构建层次化数据结构
 * 节点可以包含tile、子节点和结构信息
 */
class LtNode {
  constructor() {
    /** @type {LtTile[]} 当前节点包含的tile数组 */
    this.tiles = [];
    /** @type {LtStructure|null} 节点关联的结构信息 */
    this.structure = null;
    /** @type {LtNode[]} 子节点数组 */
    this.children = [];
  }

  /**
   * 创建LtNode的构建器实例
   * @returns {LtNodeBuilder} 新的构建器实例
   */
  static builder() {
    return new LtNodeBuilder();
  }

  /**
   * 从现有数据构建节点
   * @param {Object} data - 原始数据对象
   * @returns {LtNode} 新的LtNode实例
   */
  static fromData(data) {
    const builder = LtNode.builder();
    if (data.tiles) builder.tiles(data.tiles.map(tile => LtTile.fromData(tile)));
    if (data.structure) builder.structure(LtStructure.fromData(data.structure));
    if (data.children) builder.children(data.children.map(child => LtNode.fromData(child)));
    return builder.build();
  }
}

/**
 * LtNode构建器类
 */
class LtNodeBuilder {
  constructor() {
    /** @private @type {LtNode} */
    this.node = new LtNode();
  }

  /**
   * 设置tile数组
   * @param {LtTile[]} tiles - tile数组
   * @returns {LtNodeBuilder} 当前构建器实例
   */
  tiles(tiles) {
    this.node.tiles = tiles;
    return this;
  }

  /**
   * 添加单个tile
   * @param {LtTile} tile - 单个tile
   * @returns {LtNodeBuilder} 当前构建器实例
   */
  addTile(tile) {
    this.node.tiles.push(tile);
    return this;
  }

  /**
   * 设置结构信息
   * @param {LtStructure} structure - 结构对象
   * @returns {LtNodeBuilder} 当前构建器实例
   */
  structure(structure) {
    this.node.structure = structure;
    return this;
  }

  /**
   * 设置子节点数组
   * @param {LtNode[]} children - 子节点数组
   * @returns {LtNodeBuilder} 当前构建器实例
   */
  children(children) {
    this.node.children = children;
    return this;
  }

  /**
   * 添加单个子节点
   * @param {LtNode} child - 单个子节点
   * @returns {LtNodeBuilder} 当前构建器实例
   */
  addChild(child) {
    this.node.children.push(child);
    return this;
  }

  /**
   * 构建LtNode实例
   * @returns {LtNode} 构建完成的节点
   */
  build() {
    return this.node;
  }
}

/**
 * LTtile类，表示同一个方块的所有tile的集合
 * 支持不同Minecraft版本的Lt（1.12和1.21）的方块表示
 */
class LtTile {
  constructor() {
    /** @type {string|null} 完整的方块名称字符串
     *  - 1.12: "minecraft:wool:5"
     *  - 1.21: "minecraft:green_wool" 可包含 [facing=north] 这样的附属信息
     */
    this.block = null;
    /** @type {number|null} 未解析的十进制颜色值 */
    this.color = null;
    /** @type {number[][]} 边界框数组 [x1,y1,z1, x2,y2,z2, mask?, ex0,ex1...] */
    this.boxes = [];
  }

  /**
   * 创建LtTile的构建器实例
   * @returns {LtTileBuilder} 新的构建器实例
   */
  static builder() {
    return new LtTileBuilder();
  }

  /**
   * 从现有数据构建tile
   * @param {Object} data - 原始数据对象
   * @returns {LtTile} 新的LtTile实例
   */
  static fromData(data) {
    const builder = LtTile.builder();
    if (data.block) builder.block(data.block);
    if (data.blockInfo) builder.blockInfo(data.blockInfo);
    if (data.color !== undefined) builder.color(data.color);
    if (data.boxes) builder.boxes(data.boxes);
    return builder.build();
  }
}

/**
 * LtTile构建器类
 */
class LtTileBuilder {
  constructor() {
    /** @private @type {LtTile} */
    this.tile = new LtTile();
  }

  /**
   * 设置方块名称
   * @param {string} block - 方块名称
   * @returns {LtTileBuilder} 当前构建器实例
   */
  block(block) {
    this.tile.block = block;
    return this;
  }

  /**
   * 设置颜色值
   * @param {number} color - 未解析的十进制颜色值
   * @returns {LtTileBuilder} 当前构建器实例
   */
  color(color) {
    this.tile.color = color;
    return this;
  }

  /**
   * 设置边界框数组
   * @param {number[][]} boxes - 边界框坐标数组
   * @returns {LtTileBuilder} 当前构建器实例
   */
  boxes(boxes) {
    this.tile.boxes = boxes;
    return this;
  }

  /**
   * 添加单个边界框
   * @param {number[]} box - 单个边界框坐标 [x1,y1,z1, x2,y2,z2, ...]
   * @returns {LtTileBuilder} 当前构建器实例
   */
  addBox(box) {
    this.tile.boxes.push(box);
    return this;
  }

  /**
   * 构建LtTile实例
   * @returns {LtTile} 构建完成的tile
   */
  build() {
    return this.tile;
  }
}

/**
 * LT结构类，存储结构类型元数据
 */
class LtStructure {
  constructor() {
    /** @type {string|null} 结构唯一标识符 */
    this.id = null;
    /** @type {string|null} 结构显示名称 */
    this.name = null;
  }

  /**
   * 创建LtStructure的构建器实例
   * @returns {LtStructureBuilder} 新的构建器实例
   */
  static builder() {
    return new LtStructureBuilder();
  }

  /**
   * 从现有数据构建结构
   * @param {Object} data - 原始数据对象
   * @returns {LtStructure} 新的LtStructure实例
   */
  static fromData(data) {
    const builder = LtStructure.builder();
    if (data.id) builder.id(data.id);
    if (data.name) builder.name(data.name);
    return builder.build();
  }
}

/**
 * LtStructure构建器类
 */
class LtStructureBuilder {
  constructor() {
    /** @private @type {LtStructure} */
    this.structure = new LtStructure();
  }

  /**
   * 设置结构ID
   * @param {string} id - 结构唯一标识符
   * @returns {LtStructureBuilder} 当前构建器实例
   */
  id(id) {
    this.structure.id = id;
    return this;
  }

  /**
   * 设置结构名称
   * @param {string} name - 结构显示名称
   * @returns {LtStructureBuilder} 当前构建器实例
   */
  name(name) {
    this.structure.name = name;
    return this;
  }

  /**
   * 构建LtStructure实例
   * @returns {LtStructure} 构建完成的结构对象
   */
  build() {
    return this.structure;
  }
}



export {
  LtIR, LtNode, LtStructure, LtTile
}