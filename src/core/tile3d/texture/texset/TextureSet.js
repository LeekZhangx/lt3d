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
   * @param {keyof typeof TextureSetType} [type]
   */
  constructor(type = TextureSetType.SINGLE) {
    this.type = type

    // === 贴图 ===
    this.map = null

    this.mapPX = null
    this.mapNX = null
    this.mapPY = null
    this.mapNY = null
    this.mapPZ = null
    this.mapNZ = null

    // === 每个面的旋转（度）===
    this.rotPX = 0
    this.rotNX = 0
    this.rotPY = 0
    this.rotNY = 0
    this.rotPZ = 0
    this.rotNZ = 0
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
   * @param {Object} faces
   * @param {THREE.Texture} faces.px +X (East)
   * @param {THREE.Texture} faces.nx -X (West)
   * @param {THREE.Texture} faces.py +Y (Up)
   * @param {THREE.Texture} faces.ny -Y (Down)
   * @param {THREE.Texture} faces.pz +Z (South)
   * @param {THREE.Texture} faces.nz -Z (North)
   *
   * @returns {this} 支持链式调用
   */
  setMultiple({ px, nx, py, ny, pz, nz }) {
    this.type = TextureSetType.MULTIPLE

    this.mapPX = px
    this.mapNX = nx
    this.mapPY = py
    this.mapNY = ny
    this.mapPZ = pz
    this.mapNZ = nz

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

    // === Y轴旋转（最常见）===
    if (y !== 0) {
      this._rotateY(y)
    }

    // === X轴旋转 ===
    if (x !== 0) {
      this._rotateX(x)
    }

    // === axis（log）===
    if (axis === 'x') {
      this._rotateZ(90)
    } else if (axis === 'z') {
      this._rotateX(90)
    }

    return this
  }

  /* ================= 内部旋转实现 ================= */

  /**
   * 绕 Y 轴旋转（90°步进）
   *
   * 影响：
   * - PX → PZ → NX → NZ
   * - 同时更新对应面的 UV 旋转
   *
   * @param {number} deg
   * @private
   */
  _rotateY(deg) {
    const times = ((deg % 360) + 360) % 360 / 90

    for (let i = 0; i < times; i++) {
      // PX → PZ → NX → NZ
      const tmp = this.mapPX
      this.mapPX = this.mapPZ
      this.mapPZ = this.mapNX
      this.mapNX = this.mapNZ
      this.mapNZ = tmp

      // 旋转UV
      this.rotPX += 90
      this.rotNX += 90
      this.rotPZ += 90
      this.rotNZ += 90
    }
  }

  /**
   * 绕 X 轴旋转（90°步进）
   *
   * 影响：
   * - PY → PZ → NY → NZ
   *
   * @param {number} deg
   * @private
   */
  _rotateX(deg) {
    const times = ((deg % 360) + 360) % 360 / 90

    for (let i = 0; i < times; i++) {
      // PY → PZ → NY → NZ
      const tmp = this.mapPY
      this.mapPY = this.mapPZ
      this.mapPZ = this.mapNY
      this.mapNY = this.mapNZ
      this.mapNZ = tmp

      this.rotPY += 90
      this.rotNY += 90
      this.rotPZ += 90
      this.rotNZ += 90
    }
  }

  /**
   * 绕 Z 轴旋转（90°步进）
   *
   * 影响：
   * - PX → PY → NX → NY
   *
   * @param {number} deg
   * @private
   */
  _rotateZ(deg) {
    const times = ((deg % 360) + 360) % 360 / 90

    for (let i = 0; i < times; i++) {
      const tmp = this.mapPX
      this.mapPX = this.mapPY
      this.mapPY = this.mapNX
      this.mapNX = this.mapNY
      this.mapNY = tmp

      this.rotPX += 90
      this.rotNX += 90
      this.rotPY += 90
      this.rotNY += 90
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

    shader.uniforms.mapPX = { value: this.mapPX }
    shader.uniforms.mapNX = { value: this.mapNX }
    shader.uniforms.mapPY = { value: this.mapPY }
    shader.uniforms.mapNY = { value: this.mapNY }
    shader.uniforms.mapPZ = { value: this.mapPZ }
    shader.uniforms.mapNZ = { value: this.mapNZ }

    shader.uniforms.rotPX = { value: this.rotPX }
    shader.uniforms.rotNX = { value: this.rotNX }
    shader.uniforms.rotPY = { value: this.rotPY }
    shader.uniforms.rotNY = { value: this.rotNY }
    shader.uniforms.rotPZ = { value: this.rotPZ }
    shader.uniforms.rotNZ = { value: this.rotNZ }
  }
}