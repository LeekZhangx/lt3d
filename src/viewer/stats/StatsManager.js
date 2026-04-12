/**
 * 性能统计管理器
 *
 * - 统计渲染的性能信息，如浏览器FPS，渲染器FPS
 *
 * - 统计场景(Scene)的几何体数据属性信息，如渲染的点的数量、三角形的数量、线段的数量
 */
export class StatsManager {
  constructor(renderer) {
    this.renderer = renderer

    this._browserFps = 0
    this._renderFps = 0

    this._rafId = null
    this._intervalId = null
    this._infoInterval = null

    this._renderFrame = 0
    this._browserFrame = 0
    this._lastBrowserTime = performance.now()
    this._lastRenderTime = performance.now()

    /**
     * @typedef {Object} stats 统计数据
     * @property {number} [stats.browserFps] 浏览器FPS
     * @property {number} [stats.renderFps] 渲染器Render 的FPS
     * @property {number} [stats.calls] 自应用启动以来，总共发起的渲染调用（Draw Calls） 总数
     * @property {number} [stats.triangles] 当前帧渲染的三角形（Triangle） 数量
     * @property {number} [stats.lines] 当前帧渲染的线段（Line） 数量
     * @property {number} [stats.points] 当前帧渲染的点（Point） 数量
     */

    /**
     * @type {stats}
     */
    this.stats = {
      browserFps: 0,
      renderFps: 0,

      calls: 0,
      triangles: 0,
      lines: 0,
      points: 0
    }
  }

  /* =============================
     对外接口
  ============================== */

  /**
   * 开始统计数据
   */
  start() {
    this._startBrowserFPS()
    this._startRenderFPS()
    this._startRenderInfoUpdate()
  }

  /**
   * 停止统计数据
   */
  stop() {
    cancelAnimationFrame(this._rafId)
    clearInterval(this._intervalId)
    clearInterval(this._infoInterval)

    this._rafId = null
    this._intervalId = null
    this._infoInterval = null
  }

  /**
   * 记录renderer的帧率
   */
  recordRender() {
    this._renderFrame++
  }


  /* =============================
     内部逻辑
  ============================== */

   /**
   * 计算浏览器(Browser)的  FPS（基于 RAF）
   */
  _startBrowserFPS() {
    const loop = () => {
      this._browserFrame++
      const now = performance.now()
      const delta = now - this._lastBrowserTime

      if (delta >= 1000) {
        this._browserFps = Math.round((this._browserFrame * 1000) / delta)
        this._browserFrame = 0
        this._lastBrowserTime = now
        this.stats.browserFps = this._browserFps
      }

      this._rafId = requestAnimationFrame(loop)
    }

    this._rafId = requestAnimationFrame(loop)
  }

  /**
   * 计算渲染器(Render)的 FPS
   */
  _startRenderFPS() {
    this._intervalId = setInterval(() => {
      const now = performance.now()
      const delta = now - this._lastRenderTime

      this._renderFps = Math.round((this._renderFrame * 1000) / delta)

      this._renderFrame = 0
      this._lastRenderTime = now

      this.stats.renderFps = this._renderFps
    }, 1000)
  }

  /**
   * 更新 renderer.info
   */
  _startRenderInfoUpdate() {
    this._infoInterval = setInterval(() => {
      const info = this.renderer.info.render

      this.stats.calls = info.calls
      this.stats.triangles = info.triangles
      this.stats.lines = info.lines
      this.stats.points = info.points
    }, 500)
  }
}
