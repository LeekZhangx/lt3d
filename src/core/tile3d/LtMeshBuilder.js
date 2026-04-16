import * as THREE from 'three'
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { BlockGeometryFactory } from './geometry/BlockGeometryFactory.js';
import { BlockMaterialFactory } from './material/BlockMaterialFactory.js'
import { BlockMeshFactory } from './BlockMeshFactory.js';
import { LtAdapterFactory } from '../adapter/LtAdapterFactory.js';
import { ResourceSystem } from './resource/ResourceSystem.js';

export class LtMeshBuilder {

  /**
   * 
   * @param {ResourceSystem} resourceSystem 提供图片资源加载
   */
  constructor(resourceSystem) {

    /**
     * @type {ResourceSystem}
     */
    this.resourceSystem = resourceSystem


    /**
     * @type {number} lt不同tiles组的序号
     */
    this._id = 0
  }

  /* ===================== 对外入口 ===================== */

  /**
   * 根据ltObj生成对应的3d对象
   *
   * - 先转换不同版本的ltObj 为中间态，再生成
   *
   * @param {object} ltObj 解析后的lt文件
   * @param {string} objName
   * @returns {THREE.MeshGroup}
   */
  build(ltObj, objName, ctx) {
    this._id = 0

    //将不同版本的ltobj转换为中间体
    const adapter = LtAdapterFactory.create(ltObj.ltVersion)
    const ltIR = adapter.toIR(ltObj)

    const rootGroup = new THREE.Group()
    rootGroup.name = objName

    const grid = ltIR.grid ?? 16

    this._walkNode(ltIR, rootGroup, grid, ctx)

    return rootGroup
  }

  /* ===================== 节点遍历 ===================== */

  /**
   * 节点遍历
   * 
   * @param {object} node
   * @param {object} parent 根集合，存放不同的mesh
   * @param {number} grid
   * @param {object} ctx 
   */
  _walkNode(node, parent, grid, ctx) {

    if (Array.isArray(node.tiles)) {
      for (const tile of node.tiles) {
        const mesh = this._genTileMesh(tile, grid, ctx)
        if (!mesh) continue

        const colorStr = tile.color ? "_" + tile.color : "-1"
        mesh.name = `lt_${this._genId()}_${tile.block}${colorStr}`

        parent.add(mesh)
      }
    }

    if (Array.isArray(node.children)) {
      for (const child of node.children) {
        this._walkNode(child, parent, grid, ctx)
      }
    }
  }

  /* ===================== tile ===================== */

  _genTileMesh(tileBoxGroup, grid, ctx) {

    const boxes = tileBoxGroup.boxes
    if (!boxes) return null

    const commonBoxes = []
    const transformableBoxes = []

    for (const box of boxes) {
      if (box.length > 6) {
        transformableBoxes.push(box)
      } else {
        commonBoxes.push(box)
      }
    }

    const tileInfo = {
      block: tileBoxGroup.block,
      color: tileBoxGroup.color
    }

    const materials = BlockMaterialFactory.createMaterial(tileInfo, ctx)

    const geometries = []

    if (commonBoxes.length > 0) {
      const geo = BlockGeometryFactory.createCommonBoxes(commonBoxes, grid)
      if (geo) geometries.push(geo)
    }

    if (transformableBoxes.length > 0) {
      const geo = BlockGeometryFactory.createTransformableBoxes(transformableBoxes, grid)
      if (geo) geometries.push(geo)
    }

    if (geometries.length === 0) return null

    const geometry =
      geometries.length === 1
        ? geometries[0]
        : BufferGeometryUtils.mergeGeometries(geometries)

    const meshOrGroup =
      Array.isArray(materials)
        ? BlockMeshFactory.createMultiPassMesh(geometry, materials)
        : new THREE.Mesh(geometry, materials)

    this._setShadow(meshOrGroup)

    return meshOrGroup
  }

  /* ===================== 工具 ===================== */

  /**
   * 设置投射阴影和接受阴影
   * 
   * @param {THREE.Mesh} object 
   */
  _setShadow(object) {
    object.traverse(obj => {
      if (obj.isMesh) {
        obj.castShadow = true
        obj.receiveShadow = true
      }
    })
  }

  _genId() {
    return this._id++
  }
}