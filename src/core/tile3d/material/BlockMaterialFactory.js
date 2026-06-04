import * as THREE from 'three'
import { UVMappingType } from './UVMappingType.js'
import { LtColor } from '../util/lt/LtColor.js'
import { MaterialFactory } from './materials/MaterialFactory.js'
import { FcbMaterialFactory } from './fcb/FcbMaterialFactory.js'
import { MaterialResolver } from './materials/MaterialResolver.js'
import { BoxMappingUtil } from './sharder/BoxMappingUtil.js'
import { BoxSixMappingUtil } from './sharder/BoxSixMappingUtil.js'
import { TextureSet } from '../texture/texset/TextureSet.js'


/**
 * ============================================================
 * BlockMaterialFactory
 *
 * 职责：
 * - 根据 tile.block + tile.color 生成 Three.js 材质
 * - 完整复刻旧版材质 / 贴图 / 颜色 / 透明逻辑
 * - 一个 tile 下的所有几何体共用同一套材质
 * 
 * 外界选择所需要的映射类型，
 * 
 * 对于 普通长方体 和 变形长方体 应该采用合适的映射
 * 
 * 普通长方体： 单材质 UV映射 ； 多材质 Atlas映射
 * 
 * 变形长方体： 单/多材质 空间投影映射 WORLD_PROJECTION
 *
 * ============================================================
 */
export class BlockMaterialFactory {

    /**
     * @type {THREE.TextureLoader}
     */
    static _loader = null

    /**
     * @typedef {Object} tile
     * @property {string} [block] 如 "minecraft:stone:2" / "littletiles:ltcoloredblock"
     * @property {number|null} [color] int类型整数，如 -1，使用需要转换
     */

    /**
     * 创建基于UV映射的标准材质
     * 适用于普通方块（common boxes），使用模型UV坐标进行纹理映射
     * 
     * @param {tile} tile 存储的方块信息，包括命名空间和叠加色
     * @param {object} ctx 上下文对象，提供 textureResolver
     * @param {(blockNamespace:string)=> Object} ctx.getTextureSet 获取纹理贴图的函数
     * @returns {THREE.Material[]} 材质数组
     */
    static createUVMaterial(tile, ctx){
      return BlockMaterialFactory.createMaterial(tile, ctx, UVMappingType.UV)
    }

    /**
     * 创建基于空间投影的材质
     * 适用于可变换方块（transformable boxes），使用世界/局部坐标进行纹理投影
     *
     * @param {tile} tile 存储的方块信息，包括命名空间和叠加色
     * @param {object} ctx 上下文对象，提供 textureResolver
     * @param {(blockNamespace:string)=> Object} ctx.getTextureSet 获取纹理贴图的函数
     * @returns {THREE.Material[]} 材质数组，支持多材质叠加（如基础材质+染色材质）
     */
    static createProjectedMaterial(tile, ctx){
      return BlockMaterialFactory.createMaterial(tile, ctx, UVMappingType.WORLD_PROJECTION)
    }

    /**
     * 创建基于 Texture Atlas 的材质
     * 将六面纹理打包为一张图集，通过 shader 注入（atlas 分块）映射到各面
     *
     * @param {tile} tile 存储的方块信息，包括命名空间和叠加色
     * @param {object} ctx 上下文对象，提供 textureResolver
     * @param {(blockNamespace:string)=> Object} ctx.getTextureSet 获取纹理贴图的函数
     * @returns {THREE.Material[]} 材质数组
     */
    static createAtlasMaterial(tile, ctx){
      return BlockMaterialFactory.createMaterial(tile, ctx, UVMappingType.ATLAS)
    }

    /**
     * 创建（或复用）tile 对应的材质
     * @param {tile} tile 存储的方块信息，包括 命名空间 和 叠加色
     * @param {object} ctx 上下文对象，提供 textureResolver
     * @param {(blockNamespace:string)=> Object} ctx.getTextureSet 获取纹理贴图的函数
     * @param {typeof keyof UVMappingType} uvMappingType 
     * @returns {THREE.Material[]} tile对应的材质数组
     */
    static createMaterial(tile, ctx, uvMappingType) {
        // //使用统一的贴图加载器，方便更新信息
        // this._loader = ctx?.textureLoader

        const blockStr = tile?.block


        if (!blockStr || typeof blockStr !== 'string') {
            return new THREE.MeshStandardMaterial({
                color: Math.random() * 0xffffff
            })
        }

        const materialArr = this._buildMaterial(tile, ctx, uvMappingType)

        return materialArr
    }

    /**
     * 构建材质
     * @param {object} tile
     * @param {object} ctx 提供 textureResolver
     * @param {(blockNamespace:string)=> TextureSet} ctx.getTextureSet 获取纹理贴图对象的函数，由对应版本的 TextureSetBuilder 提供
     * @returns {THREE.Material[]}
     */
    static _buildMaterial(tile, ctx, uvMappingType) {

      /** === 1. 解析贴图 === */

      const extraColorInt = tile.color ?? -1
      const blockInfo = this._parseBlock(tile.block)
      const name = blockInfo.name

      const materials = []

      const colorAplha = this._getThreeColorAndAlpha(extraColorInt)
      //THREE.Color
      const extraColor = colorAplha?.color
      //0-1
      const alpha = colorAplha?.a

      // === 1. 先根据类型构建材质 ===

      let baseMaterial

      const matFactory = this._getMaterialFactory(blockInfo.mod)


      const matCtx = {
        name: name,
        isWater: this._isWater(name),
        isIce: this._isIce(name),
        isGlass: this._isGlassBlock(name),
        isLeaves: this._isLeaves(name),
        isGrass: this._isGrass(name)
      }

      const type = MaterialResolver.resolve(matCtx, matFactory)

      const materialData = {
        nameStr: tile.block,
        namespace: blockInfo,
        extraColorInt: extraColorInt,
        texture: null,
        extraColor: extraColor,
        alpha: alpha
      }

      baseMaterial = matFactory.create(type, materialData)

      // === 2. 再异步加载贴图覆盖 ===

      const texSet = ctx.getTextureSet(tile.block)

      if (texSet) {

        // =========================
        // 单纹理
        // =========================
        if (texSet.isSingle()) {

          if (uvMappingType === UVMappingType.ATLAS) {
            // Texture Atlas (UV): 单纹理直接使用，UV 由 geometry 提供
            baseMaterial.map = texSet.map
          } else {
            baseMaterial.map = texSet.map

            if (uvMappingType == UVMappingType.WORLD_PROJECTION) {
              BoxMappingUtil.apply(baseMaterial)
            }
          }

          materials.push(baseMaterial)
        }

        // =========================
        // 多纹理
        // =========================
        else if (texSet.isMultiple()) {

          if (uvMappingType === UVMappingType.ATLAS) {
            // Texture Atlas (UV): Canvas 图集，UV 由 geometry 指向各图块
            baseMaterial.map = ctx.createAtlas(texSet, { material: baseMaterial, namespace: tile.block })
            // 懒加载渲染：贴图替换后需标记材质更新
            baseMaterial.needsUpdate = true
          } else {
            // 六独立纹理: 6 个 sampler2D + shader 注入
            BoxSixMappingUtil.apply(baseMaterial, texSet)
          }

          materials.push(baseMaterial)
        }
      }

      return materials
    }

    /**
     * block 字符串解析
     * "minecraft:stone:2"
     * @returns { {mod:string, name:string, meta:number}}
     */
    static _parseBlock(blockStr) {
        const parts = blockStr.split(':')

        return {
            mod: parts[0] || '',
            name: parts[1] || '',
            meta: parts[2] != null ? Number(parts[2]) : 0
        }
    }

    /**
     * 根据不同的mod，返回对应的材质生成工厂
     * @param {string} modName
     * @returns
     */
    static _getMaterialFactory(modName) {

      if (modName === 'flatcoloredblocks') {
        return FcbMaterialFactory
      }

      return MaterialFactory
    }


    /**
     * 把叠加色转换成Three.Color和单独的0-255的alpha
     * @param {number} extraColorInt
     * @returns {{ color: THREE.Color, a: number }} color: Linear, a: 0 - 1
     */
    static _getThreeColorAndAlpha(extraColorInt){
      if (extraColorInt == null) return null

      const { r, g, b, a } = LtColor.intColorToRGB(extraColorInt)
      const color = new THREE.Color(r / 255, g / 255, b / 255).convertSRGBToLinear()

      return {
        color: color,
        a: a / 255
      }
    }

    static _isLeaves(name) {
      return name.includes('leaves')
    }

    static _isGrass(name) {
      return name.includes('grass')
    }

    static _isGlassBlock(name) {
      return (
        name.includes('glass') ||
        name.includes('pane')
      )
    }

    static _isWater(name) {
      return name.includes('water')
    }

    static _isIce(name) {
      return (
        name.includes('ice')
      )
    }

}
