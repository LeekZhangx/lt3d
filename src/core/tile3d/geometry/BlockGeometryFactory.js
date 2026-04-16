import * as THREE from 'three'
import { TransformableBoxFactory } from './transformable/TransformableBoxFactory.js'
import { CommonBoxFactory } from './common/CommonBoxFactory.js'

/**
 * ============================================================
 * BlockGeometryFactory
 *
 * 职责：
 * 1. 将 LittleTiles / LT 的 box 数据转换为 THREE.BufferGeometry
 * 2. 统一处理：
 *    - 普通立方体
 *    - ex 表驱动的几何变形
 *    - 世界坐标对齐 UV（不随尺寸缩放）
 *
 * 设计原则：
 * - 所有「几何形态」相关逻辑只能存在于这里
 * - 不依赖材质、不关心 block 类型
 * - 不缓存中间态，几何即最终产物
 *
 * 核心约束：
 * - 生成的几何体必须是：
 *   - 顶点顺序稳定
 *   - 可 merge
 *   - 可多 pass 渲染
 * ============================================================
 */
export class BlockGeometryFactory {

  /**
   * @typedef {number[]} box [x1,y1,z1, x2,y2,z2]
   */

  /**
   * 创建 box数组 对应的几何体
   * 
   * @param {box[]} commonBoxes 普通box数组
   *  - 单个box为 [x1,y1,z1, x2,y2,z2]
   * 
   * @param {number} grid
   * 
   * @returns {THREE.BufferGeometry}
   */
  static createCommonBoxes(commonBoxes, grid){

    return CommonBoxFactory.createDirectly(commonBoxes, grid)

  }

  /**
   * @typedef {number[]} transformableBox [x1,y1,z1, x2,y2,z2, mask, ex0,ex1 ...]
   */

  /**
   * 创建 可变形box数组 对应的几何体
   * 
   * @param {transformableBox[]} transformableBoxes 可变形box数组
   *  - 单个box为 [x1,y1,z1, x2,y2,z2, mask, ex0,ex1 ...]
   * 
   * @param {number} grid
   * 
   * @returns {THREE.BufferGeometry}
   */
  static createTransformableBoxes(transformableBoxes, grid) {

    return TransformableBoxFactory.create(transformableBoxes, grid)

  }

}
