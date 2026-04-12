import * as THREE from 'three'
import { VertexNormalsHelper } from 'three/examples/jsm/helpers/VertexNormalsHelper.js'
import { DebugMode } from './DebugMode'

/**
 * 几何调试
 */
export class DebugGeometry {

  // 调试颜色库（高对比度）
  static DEBUG_COLOR_POOL = [
    0xff3b30, // 红
    0xff9500, // 橙
    0xffcc00, // 黄
    0x34c759, // 绿
    0x5ac8fa, // 浅蓝
    0x007aff, // 蓝
    0x5856d6, // 紫
    0xaf52de, // 粉紫
    0xff2d55, // 深粉
    0x8e8e93  // 灰
  ]

  /**
   * 几何调试
   * @param {THREE.Scene} scene
   * @param {object} state 调试数据的值
   */
  constructor(scene, state) {
    this.scene = scene
    this.state = state

    this.root = new THREE.Group()
    this.root.name = 'DebugGeometryRoot'
    this.scene.add(this.root)

    this.layers = new Map()
  }

  /**
   * 启用该类型的几何体debug提示
   * @param {string} type
   * @param {THREE.Object3D} object 3D对象
   * @param {*} options 额外配置
   */
  enable(type, object, options){

    this.disable(type)

    const layer = this._getOrCreateLayer(type)
    this._build(type, object, layer, options)
  }

  /**
   * 关闭该类型的几何体debug提示
   * @param {string} type
   */
  disable(type) {
    const layer = this.layers.get(type)
    if (!layer) return

    this._disposeLayer(layer)
    this.root.remove(layer)
    this.layers.delete(type)
    this.enabledTypes.delete(type)
  }

  /**
   * 清除所有类的几何体debug提示
   */
  clear() {
    for (const layer of this.layers.values()) {
      this._disposeLayer(layer)
      this.root.remove(layer)
    }
    this.layers.clear()
  }

  update() {
    // 如果以后需要每帧同步 transform，可以在这里做
  }

  /**
   * 销毁整个 DebugGeometry（彻底卸载）
   */
  dispose() {

    // 1. 清理所有 layer
    this.clear()

    // 2. 从 scene 移除 root
    if (this.root) {
      this.scene.remove(this.root)
    }

    // 3. 清理引用
    this.layers.clear()
    this.layers = null

    this.root = null
    this.scene = null
    this.state = null
  }

  /**
   * 更新深度数据
   * @param {{depthTest:boolean, depthWrite:boolean}}
   */
  updateDepth({ depthTest, depthWrite }) {

    this.root.traverse(obj => {
      if (obj.material) {
        obj.material.depthTest = depthTest
        obj.material.depthWrite = depthWrite
        obj.material.needsUpdate = true
      }
    })
  }

  /**
   * 更新渲染顺序
   *
   * 控制渲染优先级，数值越小越先渲染
   *
   * @param {number} order
   */
  updateRenderOrder(order){
    this.root.traverse(obj => {
      obj.renderOrder = order
    })
  }

  /**
   * 创建/获取一个新的debug提示层
   * @param {string} type
   * @returns
   */
  _getOrCreateLayer(type) {
    let layer = this.layers.get(type)

    if (!layer) {
      layer = new THREE.Group()
      layer.name = `DebugLayer_${type}`
      this.layers.set(type, layer)
      this.root.add(layer)
    }

    return layer
  }

  /**
   * 根据类型构建调试层
   * @param {string} type 几何体debug类型
   * @param {object} object Three.js 3d几何体对象
   * @param {Map} layer
   * @param {object} options 额外配置项
   */
  _build(type, object, layer, options) {
    switch (type) {
      case DebugMode.WIREFRAME:
        this._addWireframe(object, layer, options)
        break
      case DebugMode.EDGES:
        this._addEdges(object, layer, options)
        break
      case DebugMode.POINTS:
        this._addPoints(object, layer, options)
        break
      case DebugMode.NORMALS:
        this._addNormals(object, layer, options)
        break
      case DebugMode.BOUNDS:
        this._addBounds(object, layer, options)
        break
    }
  }

  /**
   * 销毁debug层的所有对象
   * @param {Map} layer
   */
  _disposeLayer(layer) {
    layer.traverse(obj => {

      obj.dispose?.()

      if (obj.geometry) {
        obj.geometry.dispose()
      }

      if(obj.material) {
        if(Array.isArray(obj.material)) {
          obj.material.forEach(m => m.dispose())
        }else{
          obj.material.dispose()
        }
      }

    })
  }

  /**
   * 将目标对象的世界矩阵复制到调试对象
   *
   * 注意：
   * 当前是“静态快照模式”
   * 如果原对象移动，需要 rebuild
   *
   * @param {*} src
   * @param {*} target
   */
  _applyWorldMatrix(src, target) {
    src.updateWorldMatrix(true, false)
    target.matrixAutoUpdate = false
    target.matrix.copy(src.matrixWorld)
  }

  /**
   * 添加三角线框（会显示对角线）
   * @param {THREE.Mesh | THREE.Group} object 需要处理的3d对象 Mesh或者MeshGroup
   * @param {} layer 调试层存储容器
   * @param {{}} [options={}] 可选配置，color depthTest等
   */
  _addWireframe(object, layer, options = {}) {
    let index = 0;
    const colors = options.colors ?? DebugGeometry.DEBUG_COLOR_POOL

    object.traverse(child => {
      // 只处理 Mesh，避免重复添加
      if (!child.isMesh || child.userData._debugWireframe) return

      const color = colors[index % colors.length]
      index++

      // 从原 geometry 生成线框几何
      const wireGeo = new THREE.WireframeGeometry(child.geometry.clone().toNonIndexed())

      const wireMat = new THREE.LineBasicMaterial({
        color: color,
        depthTest: this.state.depthTest,
        depthWrite: this.state.depthWrite
      })

      const wireframe = new THREE.LineSegments(wireGeo, wireMat)
      wireframe.renderOrder = this.state.renderOrder // 强制最后渲染

      // 复制世界矩阵
      this._applyWorldMatrix(child, wireframe)

      layer.add(wireframe)
    })
  }

  /**
   * 添加外边界线（不会显示三角对角线）
   * 更适合调试 greedy 合并结果
   * @param {THREE.Mesh | THREE.Group} object 需要处理的3d对象 Mesh或者MeshGroup
   * @param {} layer 调试层存储容器
   * @param {{}} [options={}] 可选配置，color depthTest等
   */
  _addEdges(object, layer, options = {}) {

    let index = 0;
    const colors = options.colors ?? DebugGeometry.DEBUG_COLOR_POOL

    object.traverse(child => {
      if (!child.isMesh || child.userData._debugEdges) return

      const color = colors[index % colors.length]
      index++

      const edgesGeo = new THREE.EdgesGeometry(child.geometry)

      const edgesMat = new THREE.LineBasicMaterial({
          color: color,
          depthTest: this.state.depthTest,
          depthWrite: this.state.depthWrite
        })

      const edges = new THREE.LineSegments(edgesGeo, edgesMat)
      edges.renderOrder = this.state.renderOrder

      // 复制世界矩阵
      this._applyWorldMatrix(child, edges)

      layer.add(edges)
    })
  }

  /**
   * 显示顶点位置
   * 用于查看顶点是否正确生成或是否错位
   * @param {THREE.Mesh | THREE.Group} object 需要处理的3d对象 Mesh或者MeshGroup
   * @param { } layer 调试层存储容器
   * @param {{}} [options={}] 可选配置，color depthTest等
   */
  _addPoints(object, layer, options = {}) {
    let index = 0;
    const colors = options.colors ?? DebugGeometry.DEBUG_COLOR_POOL
    const size = options.size ?? 0.05

    object.traverse(child => {
      if (!child.isMesh || child.userData._debugPoints) return

      const color = colors[index % colors.length]
      index++

      const mat = new THREE.PointsMaterial({
          color: color,
          size: size,
          depthTest: this.state.depthTest,
          depthWrite: this.state.depthWrite
        })

      const points = new THREE.Points(child.geometry, mat)
      points.renderOrder = this.state.renderOrder

      // 复制世界矩阵
      this._applyWorldMatrix(child, points)

      layer.add(points)
    })
  }

  /**
   * 显示法线方向
   * 用于检查光照异常或面翻转
   * @param {THREE.Mesh | THREE.Group} object 需要处理的3d对象 Mesh或者MeshGroup
   * @param { } layer 调试层存储容器
   * @param {{}} [options={}] 可选配置，color depthTest等
  */
  _addNormals(object, layer, options = {}) {
    const size = options.size ?? 0.2
    const color = options.color ?? 0x00ffff

    object.traverse(child => {
      if (!child.isMesh || child.userData._debugNormals) return

      const helper = new VertexNormalsHelper(
        child,
        size,
        color,
        false
      )

      helper.renderOrder = this.state.renderOrder

      // 复制世界矩阵
      this._applyWorldMatrix(child, helper)

      layer.add(helper)
    })
  }

  /**
   * 显示包围盒
   * 用于查看模型尺寸 / 偏移是否正确
   * @param {THREE.Mesh | THREE.Group} object 需要处理的3d对象 Mesh或者MeshGroup
   * @param {THREE.Group} layer 调试层存储容器
   * @param {{}} [options={}] 可选配置，color depthTest等
   */
  _addBounds(object, layer, options = {}) {
    let index = 0;
    const colors = options.colors ?? DebugGeometry.DEBUG_COLOR_POOL

    object.traverse(child => {
      if (!child.isMesh || child.userData._debugBounds) return

      const color = colors[index % colors.length]
      index++

      const boxHelper = new THREE.BoxHelper(child, color)

      boxHelper.renderOrder = this.state.renderOrder

      // 复制世界矩阵
      this._applyWorldMatrix(child, boxHelper)

      layer.add(boxHelper)
    })
  }

}
