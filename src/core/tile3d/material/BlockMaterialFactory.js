import * as THREE from 'three'
import { LtColor } from '../util/lt/LtColor.js'
import { MaterialFactory } from './materials/MaterialFactory.js'
import { FcbMaterialFactory } from './fcb/FcbMaterialFactory.js'
import { MaterialResolver } from './materials/MaterialResolver.js'
import { TextureCache } from '../texture/TextureCache.js'
import { BoxMappingUtil } from './sharder/BoxMappingUtil.js'
import { BlockTextureResolver } from '../texture/BlockTextureResolver.js'


/**
 * ============================================================
 * BlockMaterialFactory
 *
 * 职责：
 * - 根据 tile.block + tile.color 生成 Three.js 材质
 * - 完整复刻旧版材质 / 贴图 / 颜色 / 透明逻辑
 * - 一个 tile 下的所有几何体共用同一套材质
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
     * 创建（或复用）tile 对应的材质
     * @param {tile} tile 存储的方块信息，包括 命名空间 和 叠加色
     * @param {object} ctx 提供 textureResolver
     * @param {BlockTextureResolver} ctx.textureResolver textureResolver
     * @returns {THREE.Material[]} tile对应的材质数组
     */
    static createMaterial(tile, ctx) {
        // //使用统一的贴图加载器，方便更新信息
        // this._loader = ctx?.textureLoader

        const blockStr = tile?.block


        if (!blockStr || typeof blockStr !== 'string') {
            return new THREE.MeshStandardMaterial({
                color: Math.random() * 0xffffff
            })
        }

        const materialArr = this._buildMaterial(tile, ctx)

        return materialArr
    }

    /**
     * 构建材质
     * @param {object} tile
     * @param {object} ctx 提供 textureResolver
     * @param {BlockTextureResolver} ctx.textureResolver textureResolver
     * @returns {THREE.Material[]}
     */
    static _buildMaterial(tile, ctx) {

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

      // === 1. 先根据类型构建材质（此时不传 texture） ===
      let texture = null

      let baseMaterial

      const matFactory = this._getMaterialFactory(blockInfo.mod)


      const matCtx = {
        name: name,
        isWater: this._isWater(name),
        isIce: this._isIce(name),
        isGlass: this._isGlassBlock(name),
        isLeavesOrGrass: this._isLeaves(name) || this._isGrass(name)
      }

      const type = MaterialResolver.resolve(matCtx, matFactory)

      const materialData = {
        nameStr: tile.block,
        namespace: blockInfo,
        extraColorInt: extraColorInt,
        texture: texture,
        extraColor: extraColor,
        alpha: alpha
      }

      baseMaterial = matFactory.create(type, materialData)

      // === 2. 再异步加载贴图覆盖 ===

      texture = ctx.getTexture(tile.block)
      baseMaterial.map = texture

      //注入sharder
      BoxMappingUtil.apply(baseMaterial, {
        scale: 1.0,      // 1单位 = 1贴图
        useFract: true,  // MC风格重复
        sharpness: 6.0   // 更硬边（接近cube）
      })

      baseMaterial.needsUpdate = true

      materials.push(baseMaterial)

      // console.log(MaterialFactory.cache);

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
