import * as THREE from 'three'
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { BlockGeometryFactory } from './geometry/BlockGeometryFactory';
import { BlockMaterialFactory } from './material/BlockMaterialFactory'
import { BlockMeshFactory } from './BlockMeshFactory';
import { BlockTextureResolverFactory } from './texture/BlockTextureResolverFactory';
import { LtAdapterFactory } from '../adapter/LtAdapterFactory';


/**
 * LtShower
 *
 * 将ltObj转化为 THREE.js 的3d对象
 *
 * 职责：
 * 1. 深度遍历 ltObj / children
 * 2. tile 层直接解析 pos / ex / block / color
 * 3. ex → 8 corner → 72 vertex 全流程在此完成
 *
 * 设计原则：
 * - 不做 format
 * - 不缓存 ex 中间态
 * - ex 语义通过 rule table 解释
 * - 几何即最终产物
 */
export class LtToMesh {


    /* ===================== 对外入口 ===================== */

    /**
     * 根据ltObj生成对应的3d对象
     *
     * - 先转换不同版本的ltObj 为中间态，再生成
     *
     * @param {object} ltObj 解析后的lt文件
     * @param {string} objName
     * @param {object} ctx
     * @returns MeshGroup
     */
    static buildMesh(ltObj, objName, ctx = {}) {
        ctx.count = 0

        // console.log("生成 Lt Mesh");

        const adapter = LtAdapterFactory.create(ltObj.ltVersion)

        const ltIR = adapter.toIR(ltObj)

        console.log(ltIR);


        //注入 textureResolver
        ctx.textureResolver = BlockTextureResolverFactory.create(ltObj.ltVersion)

        const rootGroup = new THREE.Group()
        rootGroup.name = objName

        const grid = ltIR.grid ?? 16
        this._walkNode(ltIR, rootGroup, grid, ctx)

        return rootGroup;
    }

    /**
     *
     * @param {*} node
     * @param {*} parent 根集合，存放不同的mesh
     * @param {*} grid
     * @param {*} ctx
     */
    static _walkNode(node, parent, grid, ctx) {

        if (Array.isArray(node.tiles)) {
            for (const tile of node.tiles) {
                const mesh = this._genTileMesh(tile, grid, ctx)
                if (!mesh) continue

                let colorStr = tile.color? "_" + tile.color : "-1"
                mesh.name = "lt_" + `${ctx.count++}` + "_" + tile.block + colorStr
                // console.log(mesh.name);

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

    static _genTileMesh(tileBoxGroup, grid, ctx) {

        const boxes = tileBoxGroup.boxes;

        if (!boxes) return null

        //普通立方体 长度 = 6
        const normalBoxes = []
        //变形几何体 带有ex 长度 > 6
        const transformableBoxes = []

        for (const box of boxes) {
          if (box.length > 6) {
            transformableBoxes.push(box)
          } else {
            normalBoxes.push(box)
          }
        }

        const tileInfo = {
          block : tileBoxGroup.block,
          color : tileBoxGroup.color
        }

        const materials = BlockMaterialFactory.createMaterial(tileInfo, ctx)

        const geometries = []

        //普通立方体

        //单线程方法
        if (normalBoxes.length > 0) {
          //生成几何体
          const commonGeo = BlockGeometryFactory.createCommonBoxes(normalBoxes, grid)
          if (commonGeo) geometries.push(commonGeo)
        }

        //使用worker多线程 不推荐greedy，消耗时间太大

        //可变形几何体
        if (transformableBoxes.length > 0) {
          //对同属一个大几何体的ex 优化处理
          const transformedGeo = BlockGeometryFactory.createTransformableBoxes(transformableBoxes, grid)
          if (transformedGeo) geometries.push(transformedGeo)
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

        this.setShadow(meshOrGroup)

        return meshOrGroup
    }

    /**
     * Shadow 处理统一封装
     * @param {*} object MeshOrGroup THREE.Group 或Mesh
     */
    static setShadow(object) {
      object.traverse(obj => {
        if (obj.isMesh) {
          obj.castShadow = true
          obj.receiveShadow = true
        }
      })
    }


}
