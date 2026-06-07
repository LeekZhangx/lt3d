import { LT_VERSION } from "../../../version/LtVersion.js";
import { TextureFaces } from "./TextureFaces.js";
import { TextureSetType } from "./TextureSetType.js";

/**
 * @typedef {Object} TextureSet
 * @property {keyof typeof TextureSetType} type
 * 
 * // single
 * @property {THREE.Texture} [map]
 * 
 * // six
 * @property {THREE.Texture} [mapPX]
 * @property {THREE.Texture} [mapNX]
 * @property {THREE.Texture} [mapPY]
 * @property {THREE.Texture} [mapNY]
 * @property {THREE.Texture} [mapPZ]
 * @property {THREE.Texture} [mapNZ]
 */

/**
 * 纹理集合（TextureSet）
 *
 * 用于描述一个方块的贴图结构：
 * - 单贴图（SINGLE）
 * - 六面贴图（MULTIPLE / 六方向）
 *
 * 同时负责：
 * - 存储方块的每个面的纹理
 * - 处理 Minecraft blockstate 旋转
 * - 提供 shader uniform 输出能力
 *
 *  注意：
 * - 该类是“数据 + 行为”的组合体
 * - 会被 BoxMapping / BoxSixMapping 直接消费
 */
export class TextureSet {

  /**
   * @param {keyof typeof LT_VERSION} ltVersion lt版本
   * @param {keyof typeof TextureSetType} [type]
   */
  constructor(ltVersion, type = TextureSetType.SINGLE) {

    this.ltVersion = ltVersion

    this.type = type

    // === 贴图 ===
    this.map = null

    // map: 贴图
    // rot: 贴图旋转角度
    this.faces = null

  }

  /* ================= 基础 ================= */

  /**
   * 判断是否为单贴图
   *
   * @returns {boolean}
   */
  isSingle() {
    return this.type === TextureSetType.SINGLE
  }

  /**
   * 判断是否为多贴图（六面贴图）
   *
   * @returns {boolean}
   */
  isMultiple() {
    return this.type === TextureSetType.MULTIPLE
  }

  /* ================= 设置 ================= */

  /**
   * 设置为单贴图模式
   *
   * @param {THREE.Texture} map
   * @returns {this} 支持链式调用
   */
  setSingle(map) {
    this.type = TextureSetType.SINGLE
    this.map = map
    return this
  }

  /**
   * 设置为六面贴图
   * 
   * @param {TextureFaces} faces 
   *
   * @returns {this} 支持链式调用
   */
  setMultiple(faces) {
    this.type = TextureSetType.MULTIPLE

    this.faces = faces

    return this
  }

  /* ================= 旋转 ================= */

  /**
   * 应用 Minecraft blockstate 旋转规则
   *
   * 支持：
   * - x / y：标准 blockstate 旋转
   * - axis：log / pillar 类型轴向旋转
   *
   *  注意：
   * - 仅对多贴图生效（单贴图直接返回）
   * - 会修改：
   *   - 各面贴图位置（mapPX 等）
   *   - UV 旋转角度（rotPX 等）
   *
   * @param {Object} options
   * @param {number} [options.x=0] 绕 X 轴旋转角度（度，90倍数）
   * @param {number} [options.y=0] 绕 Y 轴旋转角度（度，90倍数）
   * @param {'x'|'y'|'z'} [options.axis='y'] 方块轴方向（如原木）
   *
   * @returns {this}
   */
  applyBlockRotation({ x = 0, y = 0, axis = 'y' } = {}) {

    if (this.isSingle()) return this

    // === Y轴旋转 ===
    if (y !== 0) {
      this._rotateY(y)
    }

    // === X轴旋转 ===
    if (x !== 0) {
      this._rotateX(x)
    }

    // === axis ===
    this._applyAxis(axis)

    return this
  }

  /* ================= 内部旋转实现 ================= */

  _applyAxis(axis) {


    if (axis === 'y') return

    const f = this.faces

    if (axis === 'x') {

      const py = f.py
      const ny = f.ny

      f.py = f.nx
      f.ny = f.px

      f.px = py
      f.nx = ny

      f.py.rotate(90)
      f.ny.rotate(90)

      f.pz.rotate(90)
      f.nz.rotate(90)
    }

    else if (axis === 'z') {

      const py = f.py
      const ny = f.ny

      f.py = f.nz
      f.ny = f.pz
      f.pz = py
      f.nz = ny

      f.px.rotate(90)
      f.nx.rotate(90)
    }
  }

  /**
   * 绕 Y 轴旋转（90°步进）
   *
   * 几何面固定，方块纹理随旋转迁移。
   * 顺时针（从 +Y 看向 -Y）：PX 面纹理由 NZ 提供，PZ 由 PX 提供…
   * 即代码 PX ← NZ ← NX ← PZ ← PX（纹理来源链）
   *
   * 等效纹理去向链：PX → PZ → NX → NZ → PX
   */
  _rotateY(deg) {
    console.log(deg);
    
    const times = ((deg % 360) + 360) % 360 / 90

    for (let i = 0; i < times; i++) {

      const f = this.faces

      const tmp = f.px.clone()

      f.px = f.nz.clone()
      f.nz = f.nx.clone()
      f.nx = f.pz.clone()
      f.pz = tmp

      f.py.rotate(90)
      f.ny.rotate(-90)
    }
  }

  /**
   * 绕 X 轴旋转（90°步进）
   * 纹理去向链：PY → PZ → NY → NZ → PY
   */
  _rotateX(deg) {
    const times = ((deg % 360) + 360) % 360 / 90

    for (let i = 0; i < times; i++) {

      const f = this.faces

      const tmp = f.py.clone()

      f.py = f.pz.clone()
      f.pz = f.nx.clone()
      f.nx = f.nz.clone()
      f.nz = tmp

      f.px.rotate(90)
      f.nx.rotate(-90)
    }
  }

  /**
   * 绕 Z 轴旋转（90°步进）
   * 纹理去向链：PX → PY → NX → NY → PX
   */
  _rotateZ(deg) {
    const times = ((deg % 360) + 360) % 360 / 90

    for (let i = 0; i < times; i++) {

      const f = this.faces

      const tmp = f.py.clone()

      f.py = f.nx.clone()
      f.nx = f.ny.clone()
      f.ny = f.px.clone()
      f.px = tmp

      f.pz.rotate(90)
      f.nz.rotate(-90)
    }
  }

  /* ================= 输出 ================= */

    /**
   * 将 TextureSet 数据绑定到 shader uniforms
   *
   * 用于 BoxMapping / BoxSixMapping 的 shader 注入阶段
   *
   * 行为：
   * - SINGLE：
   *   - 写入 shader.uniforms.map
   *
   * - MULTIPLE：
   *   - 写入六个面纹理（mapPX ~ mapNZ）
   *   - 写入每个面的 UV 旋转（rotPX ~ rotNZ）
   *
   * 注意：
   * - 必须在 material.onBeforeCompile(shader) 中调用
   * - 会覆盖同名 uniform
   *
   * @param {THREE.Shader} shader
   */
  toUniforms(shader) {

    if (this.isSingle()) {
      shader.uniforms.map = { value: this.map }
      return
    }

    const f = this.faces

    shader.uniforms.mapPX = { value: f.px.map }
    shader.uniforms.mapNX = { value: f.nx.map }
    shader.uniforms.mapPY = { value: f.py.map }
    shader.uniforms.mapNY = { value: f.ny.map }
    shader.uniforms.mapPZ = { value: f.pz.map }
    shader.uniforms.mapNZ = { value: f.nz.map }

    shader.uniforms.rotPX = { value: f.px.rot }
    shader.uniforms.rotNX = { value: f.nx.rot }
    shader.uniforms.rotPY = { value: f.py.rot }
    shader.uniforms.rotNY = { value: f.ny.rot }
    shader.uniforms.rotPZ = { value: f.pz.rot }
    shader.uniforms.rotNZ = { value: f.nz.rot }
  }
}