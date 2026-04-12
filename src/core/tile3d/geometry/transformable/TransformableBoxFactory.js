import * as THREE from 'three'
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils'
import { RuleTableFormatter } from './RuleTableFormatter'
import { BoxFlipUtil } from './BoxFlipUtil'
import { BoxOffsetUtil } from './BoxOffsetUtil'
import { GeoFaceOptimizeUtli } from './util/GeoFaceOptimizeUtil'
import { FaceCornerMoveUtil } from './util/FaceCornerMoveUtli'
import { Brush, Evaluator, INTERSECTION } from 'three-bvh-csg'

/**
 * 可变形Box工厂
 */
export class TransformableBoxFactory{

  /**
   * 创建 可变形box数组 所对应的几何体
   * @type {number[]} box
   *  [
   *     x1, y1, z1,
   *     x2, y2, z2,
   *     mask?, ex0?, ex1?, ...
   *   ]
   * @param {box[]} transformableBoxes 这里的box携带ex数据
   * @param {number} grid
   * @returns {THREE.BufferGeometry}
   */
  static create(transformableBoxes, grid) {

    if (!transformableBoxes || transformableBoxes.length === 0) return null

    const geometries = []

    const evaluator = new Evaluator();

    for (let i = 0; i < transformableBoxes.length; i++) {

      const box = transformableBoxes[i]

      const x1 = box[0]
      const y1 = box[1]
      const z1 = box[2]
      const x2 = box[3]
      const y2 = box[4]
      const z2 = box[5]

      const mask = box[6] ?? 0
      const exArr = box.length > 7 ? box.slice(7) : []

      /* ================= 尺寸 & 位置 ================= */

      const sizeX = Math.abs(x2 - x1) / grid
      const sizeY = Math.abs(y2 - y1) / grid
      const sizeZ = Math.abs(z2 - z1) / grid

      const size = [sizeX, sizeY, sizeZ]

      const posX = (x1 + x2) / 2 / grid
      const posY = (y1 + y2) / 2 / grid
      const posZ = (z1 + z2) / 2 / grid

      const geo = new THREE.BoxGeometry(sizeX, sizeY, sizeZ)

      geo.translate(posX, posY, posZ)

      /* ================= ex 变形 ================= */

      const result = RuleTableFormatter.formatCornerRuleTable(mask, exArr, grid)

      // console.log(result);

      let ruleTable = result.ruleTable

      let needCut = result.needCut

      ruleTable = this._preprocessFlippedRule(ruleTable, size)

      BoxFlipUtil.applyFlip(geo, ruleTable)

      BoxOffsetUtil.applyOffset(geo, ruleTable)

      GeoFaceOptimizeUtli.optimizeGeoFace(geo)

      geo.computeBoundingBox()
      geo.computeBoundingSphere()


      //不进行uv处理，由TriplanarUtil完成贴图映射
      /* ================= UV 处理 ================= */

      //在变形之后重新计算
      // if(needCut){
      //   const res = this.computeSize(ruleTable, [x1, y1, z1, x2, y2, z2])

      //   UVUtils.applyBoxUV(
      //     geo,
      //     res,
      //     grid
      //   )
      //   console.log({ x1, y1, z1, x2, y2, z2 });

      //   console.log(res);

      // }else{
      //   UVUtils.applyBoxUV(
      //     geo,
      //     { x1, y1, z1, x2, y2, z2 },
      //     grid
      //   )
      // }

      /* ================= 变形切割 ================= */

      //限制变形后的几何体的范围
      if(needCut){
        const det = 1e-6;
        const borderGeo = new THREE.BoxGeometry(
          sizeX + det * 2,
          sizeY + det * 2,
          sizeZ + det * 2
        );

        // borderGeo.scale(1+det,1+det,1+det);
        borderGeo.translate(
          posX + det,
          posY + det,
          posZ + det
        );

        //使用three bvh csg 切割几何体 取交集
        //变形后的 lt几何体
        const brushGeo = new Brush(geo)
        brushGeo.updateMatrixWorld();

        //原先边界
        const brushCube = new Brush(borderGeo);
        brushCube.updateMatrixWorld();

        const cuttedGeo = evaluator.evaluate( brushGeo, brushCube, INTERSECTION ).geometry;

        geometries.push(cuttedGeo)

      }else{

        geometries.push(geo)

      }

    }

    const geometry =
      geometries.length === 1
        ? geometries[0]
        : BufferGeometryUtils.mergeGeometries(geometries)

    return geometry
  }



  /* ==========================================================
   * ruleTable flipped 变形相关
   * ========================================================== */

  /**
   * 预处理ruleTable，修改flipped的值，包括 E W U D S N面。
   *
   * 对其 sign 进行 异或合并
   *
   * 由于BoxGeo和mc的方块对角线不同，需要预处理翻转面
   *
   * @param {object[]} ruleTable
   * @param {number[]} offsetArr
   * @param {number[]} size [sizeX, sizeY, sizeZ]
   * @returns newRuleTable
   */
  static  _preprocessFlippedRule(ruleTable, size){

    let newRuleTable = ruleTable.map(r => r ? {...r} : r)

    this._flipRuleTableFace(newRuleTable)

    this._filpOppositeFace(newRuleTable, size)

    return newRuleTable
  }

  /**
   * 面在 ruleTable 中的 index值
   */
  static FACE_TO_BIT = {
      E: 2,
      W: 3,
      U: 6,
      D: 7,
      S: 4,
      N: 5
  }

  /**
   * 预处理ruleTable
   * 默认faces，将BoxGeometry的对角线翻转成适配Lt的
   * 也可以自行设置faces
   *
   * @param {object[]} ruleTable 需要预处理的ruleTable
   * @param {string[]} faces 翻转面的字母数组，默认为['E','W','U','D','S','N']
   */
  static _flipRuleTableFace(ruleTable, faces = ['E','W','U','D','S','N']){

    for (const f of faces) {

      const bit = this.FACE_TO_BIT[f]
      if (bit === undefined) continue

      const r = ruleTable[bit]
      if (!r) continue
      //当 同步几何体的面的对角线 和 rule 有其中一个要翻转才执行
      //Box的对角线和期望的是相反的
      r.sign = r.sign ^ 1
    }
  }

  /**
   * 预处理ruleTable，
   * 翻转 移动面 的 相对面 的对角线
   *
   * - 当一个面的至少3个顶点，都发生位移，且和相对面的相邻顶点重合，
   * - 同步 相对面的对角线 为 当前面的对角线 的方向
   * @param {object[]} ruleTable
   * @param {number[]} size
   */
  static _filpOppositeFace(ruleTable, size){

    const res = FaceCornerMoveUtil.detect(ruleTable, size);

    let faces = []

    //三个顶点在某轴向完全位移的面A和他的相对面B,同步面A面B的对角线朝向
    for(let i = 0; i < res.length; i++){

      const f = res[i].face
      const o = res[i].opposite

      const fIdx = this.FACE_TO_BIT[f]
      const oIdx = this.FACE_TO_BIT[o]

      const fSign = ruleTable[fIdx].sign
      ruleTable[oIdx].sign = fSign ^ 1

    }

    this._flipRuleTableFace(ruleTable, faces)
  }

  /**
   * 计算变形后的尺寸大小
   * @param {object[]} ruleTable
   * @param {number[]} bounds [x1,y1,z1,x2,y2,z2]
   * @returns
   */
  static computeSize(ruleTable, bounds){
    const [x1,y1,z1,x2,y2,z2] = bounds

    const CORNER_DIR = [
      [-1,-1, 1], [-1,-1,-1], [-1, 1, 1], [-1, 1,-1],
      [ 1,-1, 1], [ 1,-1,-1], [ 1, 1, 1], [ 1, 1,-1],
    ]


    // 每个corner的偏移累计
    const offsets = new Float32Array(8 * 3)


    for (let bit = 8; bit <= 31; bit++) {
      const item = ruleTable[bit]
      if (!item || !item.sign) continue

      const i = bit - 8
      const cornerIndex = (i / 3) | 0
      const axisIndexXYZ = i % 3

      offsets[cornerIndex*3 + axisIndexXYZ] += item.val
    }

    // 直接算 AABB
    let minX = Infinity, minY = Infinity, minZ = Infinity
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity

    for (let i = 0; i < 8; i++) {

      const dir = CORNER_DIR[i]

      let x = dir[0] === -1 ? x1 : x2
      let y = dir[1] === -1 ? y1 : y2
      let z = dir[2] ===  1 ? z2 : z1

      x += offsets[i*3 + 0]
      y += offsets[i*3 + 1]
      z += offsets[i*3 + 2]

      if (x < minX) minX = x
      if (y < minY) minY = y
      if (z < minZ) minZ = z

      if (x > maxX) maxX = x
      if (y > maxY) maxY = y
      if (z > maxZ) maxZ = z
    }

    return {
      x1: minX, y1: minY , z1: minZ,
      x2: maxX, y2: maxY , z2: maxZ
    }
  }

}
