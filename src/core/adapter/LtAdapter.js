import {LtIR, LtNode, LtStructure, LtTile} from '../ir/LtIR.js'

/**
 * @abstract
 * @description Lt对象适配器抽象基类，所有版本适配器都应继承此类
 */
export class LtAdapter {
  
  /**
   * 构造函数
   * @throws {Error} 抽象类不能直接实例化
   */
  constructor() {
    if (new.target === LtAdapter) {
      throw new Error('LtAdapter is an abstract class and cannot be instantiated directly')
    }
  }

  /**
   * 将ltobj转为供3d化的中间表示
   * @abstract
   * @param {Object} ltObj - 原始lt对象
   * @returns {LtIR}
   * @throws {Error} 子类必须实现此方法
   */
  toIR(ltObj) {
    throw new Error('Abstract method toIR must be implemented by subclass')
  }

  /**
   * 解析子节点数组
   * @abstract
   * @param {Array} children - 子节点数组
   * @returns {LtNode[]}
   * @throws {Error} 子类必须实现此方法
   */
  _parseChildren(children) {
    throw new Error('Abstract method _parseChildren must be implemented by subclass')
  }

  /**
   * 解析单个节点
   * @abstract
   * @param {Object} node - 节点对象
   * @returns {LtNode}
   * @throws {Error} 子类必须实现此方法
   */
  _parseNode(node) {
    throw new Error('Abstract method _parseNode must be implemented by subclass')
  }

  /**
   * 解析瓦片数组
   * @abstract
   * @param {Array} tArr - 瓦片数组
   * @returns {LtTile[]}
   * @throws {Error} 子类必须实现此方法
   */
  _parseTiles(tArr) {
    throw new Error('Abstract method _parseTiles must be implemented by subclass')
  }

  /**
   * 解析边界框数组
   * @abstract
   * @param {Array} boxes - 边界框数组
   * @returns {number[][]}
   * @throws {Error} 子类必须实现此方法
   */
  _parseBoxes(boxes) {
    throw new Error('Abstract method _parseBoxes must be implemented by subclass')
  }

  /**
   * 解析结构信息
   * @abstract
   * @param {Object} structure - 结构对象
   * @returns {LtStructure|undefined}
   * @throws {Error} 子类必须实现此方法
   */
  _parseStructure(structure) {
    throw new Error('Abstract method _parseStructure must be implemented by subclass')
  }
}