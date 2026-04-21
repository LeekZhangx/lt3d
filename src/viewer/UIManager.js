import { CameraPanel } from './core/CaneraPanel.js'
import { DebugPanel } from './debug/DebugPanel.js'
import { ScenePanel } from './scene/ScenePanel.js'
import { StatsPanel } from './stats/StatsPanel.js'

/**
 * UI 管理器
 * 
 * - 统一管理所有 GUI 面板
 * - 不参与核心逻辑
 */
export class UIManager {

  constructor() {
    this.scenePanel = null
    this.cameraPanel = null
    this.statsPanel = null
    this.debugPanel = null
  }

  /**
   * 更新GUI的控件的内容，以适配不同的模型
   * 
   * 在模型变化后调用
   */
  updateGUI(){
    this.scenePanel?.updateGUI()
  }

  // ===============================
  // Scene Panel
  // ===============================

  /**
   * 打开 Scene 面板
   *
   * @param {Object} params
   * @param {HTMLElement} params.container 面板挂载容器
   * @param {SceneManager} params.sceneManager 场景管理器（提供场景控制能力）
   */
  openScenePanel({ container, sceneManager }) {
    if (!this.scenePanel) {
      this.scenePanel = new ScenePanel(sceneManager)
      this.scenePanel.enableGUI(container)
    } else {
      this.scenePanel.showGUI()
    }
  }

  /**
   * 隐藏 Scene 面板
   */
  hideScenePanel() {
    if (this.scenePanel) {
      this.scenePanel.hideGUI()
    }
  }

  /**
   * 切换 Scene 面板显示状态
   *
   * @param {Object} params
   * @param {HTMLElement} params.container 面板挂载容器
   * @param {SceneManager} params.sceneManager 场景管理器
   */
  toggleScenePanel(params) {
    if (!this.scenePanel || !this.scenePanel.isShow) {
      this.openScenePanel(params)
    } else {
      this.hideScenePanel()
    }
  }

  // ===============================
  // Camera Panel
  // ===============================

  /**
   * 打开 Camera 面板（用于切换相机类型）
   *
   * @param {Object} params
   * @param {HTMLElement} params.container 面板挂载容器
   * @param {() => 'perspective' | 'orthographic'} params.getType 获取当前相机类型（用于初始化 GUI 状态）
   * @param {(type: 'perspective' | 'orthographic') => void} params.onSwitch 相机切换回调（由外部执行实际切换逻辑）
   */
  openCameraPanel({ container, getType, onSwitch }) {
    if (!this.cameraPanel) {
      this.cameraPanel = new CameraPanel({
        getType,
        onSwitch
      })

      this.cameraPanel.enableGUI(container)
    } else {
      this.cameraPanel.showGUI()
    }
  }

  /**
   * 隐藏 Scene 面板
   */
  hideCameraPanel() {
    if (this.cameraPanel) {
      this.cameraPanel.hideGUI()
    }
  }

  /**
   * 切换 Camera 面板显示状态
   *
   * @param {Object} params
   * @param {HTMLElement} params.container 面板挂载容器
   * @param {SceneManager} params.sceneManager 场景管理器
   */
  toggleCameraPanel(params) {
    if (!this.cameraPanel || !this.cameraPanel.isShow) {
      this.openCameraPanel(params)
    } else {
      this.hideCameraPanel()
    }
  }

  // ===============================
  // Stats Panel
  // ===============================

  /**
   * 打开 Stats 面板（性能/统计信息）
   *
   * @param {Object} params
   * @param {HTMLElement} params.container 面板挂载容器
   * @param {THREE.Scene} params.scene Three.js 场景
   * @param {THREE.WebGLRenderer} params.renderer 渲染器
   */
  openStatsPanel({ container, scene, renderer }) {
    if (!this.statsPanel) {
      this.statsPanel = new StatsPanel(scene, renderer)
      this.statsPanel.enableGUI(container)
    } else {
      this.statsPanel.showGUI()
    }
  }

  /**
   * 隐藏 Stats 面板
   */
  hideStatsPanel() {
    if (this.statsPanel) {
      this.statsPanel.hideGUI()
    }
  }

  /**
   * 切换 Stats 面板显示状态
   *
   * @param {Object} params
   * @param {HTMLElement} params.container
   * @param {THREE.Scene} params.scene
   * @param {THREE.WebGLRenderer} params.renderer
   */
  toggleStatsPanel(params) {
    if (!this.statsPanel || !this.statsPanel.isShow) {
      this.openStatsPanel(params)
    } else {
      this.hideStatsPanel()
    }
  }

  // ===============================
  // Debug Panel
  // ===============================

  /**
   * 打开 Debug 面板（调试工具）
   *
   * @param {Object} params
   * @param {HTMLElement} params.container 面板挂载容器
   * @param {DebugManager} params.debugManager 调试管理器
   * @param {() => THREE.Object3D} params.getModel 获取当前模型
   * @param {() => void} params.requestRender 请求重新渲染
   */
  openDebugPanel({ container, debugManager, getModel, requestRender }) {
    if (!this.debugPanel) {
      this.debugPanel = new DebugPanel(debugManager)

      this.debugPanel.enableGUI(
        getModel,
        container,
        requestRender
      )
    } else {
      this.debugPanel.showGUI()
    }
  }

  /**
   * 隐藏 Debug 面板
   */
  hideDebugPanel() {
    if (this.debugPanel) {
      this.debugPanel.hideGUI()
    }
  }

  /**
   * 切换 Debug 面板显示状态
   *
   * @param {Object} params
   * @param {HTMLElement} params.container
   * @param {DebugManager} params.debugManager
   * @param {() => THREE.Object3D} params.getModel
   * @param {() => void} params.requestRender
   */
  toggleDebugPanel(params) {
    if (!this.debugPanel || !this.debugPanel.isShow) {
      this.openDebugPanel(params)
    } else {
      this.hideDebugPanel()
    }
  }

  /**
   * 销毁全部的GUI
   */
  dispose(){
    this.scenePanel?.dispose()
    this.scenePanel = null

    this.cameraPanel?.dispose()
    this.cameraPanel = null

    this.statsPanel?.dispose()
    this.statsPanel = null

    this.debugPanel?.dispose()
    this.debugPanel = null
  }
  
}