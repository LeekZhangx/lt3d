import * as THREE from 'three'
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { BlockGeometryFactory } from './geometry/BlockGeometryFactory.js';
import { BlockMaterialFactory } from './material/BlockMaterialFactory.js'
import { LtAdapterFactory } from '../adapter/LtAdapterFactory.js';
import { ResourceSystem } from './resource/ResourceSystem.js';
import { LtIR, LtNode } from '../ir/LtIR.js';

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
  build(ltObj, objName) {
    this._id = 0

    //将不同版本的ltobj转换为中间体
    const adapter = LtAdapterFactory.create(ltObj.ltVersion)
    const ltIR = adapter.toIR(ltObj)

    const rootGroup = new THREE.Group()
    rootGroup.name = objName

    const grid = ltIR.grid ?? 16

    const ctx = this.resourceSystem.createBuildContext(ltObj.ltVersion)

    this._walkNode(ltIR, rootGroup, grid, ctx)

    return rootGroup
  }

  /* ===================== 节点遍历 ===================== */

  /**
   * 节点遍历
   * 
   * @param {LtIR | LtNode} node
   * @param {object} parent 根集合，存放不同的mesh
   * @param {number} grid
   * @param {object} ctx 
   * @param {(blockNamespace:string)=> Object} ctx.getTextureSet ResourceSystem 提供的加载贴图的函数
   */
  _walkNode(node, parent, grid, ctx) {

    if (Array.isArray(node.tiles)) {
      for (const tile of node.tiles) {
        const mesh = this._genTileMeshWihDiffMat(tile, grid, ctx)
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

  /**
   * 
   * @deprecated use _genTileMeshWihDiffMat
   * 
   * @param {*} tileBoxGroup 
   * @param {*} grid 
   * @param {*} ctx 
   * @returns 
   */
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
        ? this._createMultiPassMesh(geometry, materials)
        : new THREE.Mesh(geometry, materials)


    return meshOrGroup
  }

  /**
   * 对生成的tile分类，common和transformable赋予不同纹理映射mapping类型的材质
   * 
   * @param {*} tileBoxGroup 
   * @param {*} grid 
   * @param {*} ctx 
   * @returns 
   */
  _genTileMeshWihDiffMat(tileBoxGroup, grid, ctx) {

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

    const tile = {
      block: tileBoxGroup.block,
      color: tileBoxGroup.color
    }

    const meshes = []

    // 普通长方体 → Texture Atlas (shader 逐像素空间投影)
    if (commonBoxes.length > 0) {
      const geo = BlockGeometryFactory.createCommonBoxes(commonBoxes, grid)
      if (geo) {
        const matArr = BlockMaterialFactory.createAtlasMaterial(tile, ctx)
        const meshOrGroup = this._createMultiPassMesh(geo, matArr)
        meshes.push(meshOrGroup)
      }
    }

    // 变形长方体 → 空间投影（6 独立纹理）
    if (transformableBoxes.length > 0) {
      const geo = BlockGeometryFactory.createTransformableBoxes(transformableBoxes, grid)
      if (geo) {
        const matArr = BlockMaterialFactory.createProjectedMaterial(tile, ctx)
        const meshOrGroup = this._createMultiPassMesh(geo, matArr)
        meshes.push(meshOrGroup)
      }
    }

    return this._mergeMeshes(meshes)
  }

  /* ===================== 工具 ===================== */

  _genId() {
    return this._id++
  }

  /**
   * 创建 Group 组，处理材质混合和渲染顺序
   * 
   * @param {THREE.Mesh[]} geometry - Mesh 数组
   * @param {THREE.Material[]} materials - 材质数组
   * @returns {THREE.Mesh | THREE.Group}
   */
  _createMultiPassMesh(geometry, materials) {
    // 只有一个材质，没必要 Group
    if (materials.length === 1) {
      const mesh = new THREE.Mesh(geometry, materials[0])
      mesh.castShadow = true
      mesh.receiveShadow = true
      return mesh
    }

    // 多个材质，创建 Group 包含多个 Mesh
    const group = new THREE.Group()

    materials.forEach((material, index) => {
      const mesh = new THREE.Mesh(geometry, material)

      mesh.castShadow = true
      mesh.receiveShadow = true

      // === 关键规则 ===
      // overlay 层不写深度
      if (material.blending === THREE.MultiplyBlending) {
        mesh.renderOrder = 1
        mesh.material.depthWrite = false
      } else {
        mesh.renderOrder = 0
      }

      group.add(mesh)
    })

    return group
  }

  /**
   * 合并多个 Mesh/Group
   * @param {Array<THREE.Mesh|THREE.Group>} items
   * @returns {THREE.Mesh|THREE.Group|null}
   */
  _mergeMeshes(items) {
    if (items.length === 0) return null
    if (items.length === 1) return items[0]

    const finalGroup = new THREE.Group()
    
    items.forEach(item => {
      if (!item) return
      
      if (item.isGroup) {
        // 如果是 Group，添加其所有子物体
        item.children.forEach(child => finalGroup.add(child))
      } else if (item.isMesh) {
        // 如果是 Mesh，直接添加
        finalGroup.add(item)
      }
    })
    
    return finalGroup
  }
}