import { CameraController } from '../camera/CameraController.js'
import { CameraPanel } from '../camera/CaneraPanel.js'
import { DebugController } from '../debug/DebugController.js'
import { DebugPanel } from '../debug/DebugPanel.js'
import { SceneController } from '../scene/SceneController.js'
import { ScenePanel } from '../scene/ScenePanel.js'
import { StatsManager } from '../stats/StatsManager.js'
import { StatsPanel } from '../stats/StatsPanel.js'

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
   * @param {SceneController} params.sceneController 调试控制器
   */
  openScenePanel({ container, sceneController }) {
    if (!this.scenePanel) {
      this.scenePanel = new ScenePanel()
      this.scenePanel.enableGUI(sceneController, container)
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
   * @param {SceneController} params.sceneController 调试控制器
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
   * @param {CameraController} params.cameraController 相机控制器
   */
  openCameraPanel({ container, cameraController }) {
    if (!this.cameraPanel) {
      this.cameraPanel = new CameraPanel(cameraController)

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
   * @param {SceneManager} params.cameraController 相机控制器
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
   * @param {StatsManager} params.statsManager 心机统计管理器
   */
  openStatsPanel({ container, statsManager}) {
    if (!this.statsPanel) {
      this.statsPanel = new StatsPanel(statsManager)
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
   * @param {HTMLElement} params.container 面板挂载容器
   * @param {StatsManager} params.statsManager 场景管理器
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
   * @param {DebugController} params.debugController 调试控制器
   */
  openDebugPanel({ container, debugController}) {
    if (!this.debugPanel) {
      this.debugPanel = new DebugPanel(debugController)

      this.debugPanel.enableGUI(
        container
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
   * @param {HTMLElement} params.container 面板挂载容器
   * @param {DebugController} params.debugController 调试控制器
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