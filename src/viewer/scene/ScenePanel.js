import { GUI } from 'lil-gui'
import { SceneManager } from './SceneManager'
import { GuiTheme } from '../util/GuiTheme'
import { SCENE_CONFIG } from '../config/config'

/**
 * 场景环境 GUI 控制面板
 *
 * - 调整灯光位置
 * - 替换地面贴图
 */
export class ScenePanel {

  /**
   * 实例化 场景环境 GUI 控制面板
   * @param {SceneManager} sceneManager
   */
  constructor(sceneManager) {
    this.sceneManager = sceneManager
    this.gui = null

    /**
     * 当前GUI是否显示
     */
    this.isShow = false

    this.controller = {
      dirLightX: null,
      dirLightY: null,
      dirLightZ: null
    }

  }

  /**
   * 启用GUI
   *
   * @param {HTMLDivElement} GUI 挂载的 DOM 容器
   * @param {() => void} requestRender 请求重新渲染的方法（用于 GUI 改变后刷新画面）
   * @param {keyof GuiTheme.THEME} guiTheme gui主题， 获取自 GuiTheme.THEME
   * @returns
   */
  enableGUI(container, requestRender, guiTheme) {
    if (this.gui) return

    this.gui = new GUI({
      title: 'Scene',
      container
    })


    // ===== 定向光 =====
    const directLight = this.sceneManager.lights.direct

    const directLightFolder = this.gui.addFolder('Direct Light')

    directLightFolder.add(directLight, 'intensity', 0, 5, 0.1)
      .onChange(v => {
        this.sceneManager.setDirectLightIntensity(v)
        requestRender?.()
    })

    this.controller.dirLightX = directLightFolder.add(directLight.position, 'x', -10, 10)
      .onChange(v => {
        requestRender?.()
    })
    this.controller.dirLightY = directLightFolder.add(directLight.position, 'y', 0, 50)
      .onChange(v => {
        requestRender?.()
    })
    this.controller.dirLightZ = directLightFolder.add(directLight.position, 'z', -10, 10)
      .onChange(v => {
        requestRender?.()
    })

    // ===== 环境光 =====
    const ambientLightFolder = this.gui.addFolder('Ambient Light')

    const ambientLight = this.sceneManager.lights.ambient

    ambientLightFolder.add(ambientLight, 'intensity', 0, 5, 0.1)
      .onChange(v => {
        this.sceneManager.setAmbientLightIntensity(v)
        requestRender?.()
    })

    // ===== 地面 =====
    const ground = this.sceneManager.ground

    const groundState = {
      scale: ground.scale.x,
      visible: true,
      texturePath: '',
      textureType: null
    }

    const groundFolder = this.gui.addFolder('Ground Plane')

    //地面可视
    groundFolder.add(groundState, 'visible')
      .name('visible')
      .onChange(v => {
        this.sceneManager.setGroundVisible(v)
        requestRender?.()
      })


    // 地面大小
    groundFolder.add(groundState, 'scale', 1, 100)
      .name('scale')
      .step(1)
      .onChange(val => {
        this.sceneManager.setGroundScale(val)
        requestRender?.()
      })


    // 地面贴图 下拉选择
    const textures = SCENE_CONFIG.ground.textures

    const textureKeys = Object.keys(textures)

    // 默认贴图
    groundState.textureType = textureKeys[0]

    const current = textures[groundState.textureType]
    groundState.texturePath = current.path

    // GUI
    groundFolder.add(groundState, 'textureType', textureKeys)
      .name('texture')
      .onChange(key => {
        const tex = textures[key]

        this.sceneManager.setGroundTexture(tex.path, tex.color)

        requestRender?.()
      })



    this.applySceneState({
      directLight,
      ambientLight,
      groundState
    })

    this.updateGUI()
    requestRender?.()

    const theme = guiTheme ?? GuiTheme.THEME.GREEN
    GuiTheme.apply(this.gui, theme)
    this.isShow = true
  }

  /**
   * @typedef {Object} sceneStateParam
   * @property {object} [directLight] 定向光对象
   * @property {object} [ambientLight] 环境光对象
   * @property {groundState} [groundState] 地面状态
   *
   * @typedef {Object} groundState 地面状态
   * @property {boolean} [visible] visible 地面是否可见
   * @property {string} [texturePath] 地面贴图路径
   */

  /**
   * 应用默认场景设置
   *
   * GUI创建控件和绑定事件，不会激活一次方法，需要手动同步初始化状态
   *
   * @param {sceneStateParam} sceneStateParam
   */
  applySceneState({ directLight, ambientLight, groundState }) {
    this.sceneManager.setDirectLightIntensity(directLight.intensity)
    this.sceneManager.setAmbientLightIntensity?.(ambientLight.intensity)

    this.sceneManager.lights.direct.position.copy(directLight.position)

    this.sceneManager.setGroundVisible(groundState.visible)
    this.sceneManager.setGroundTexture(groundState.texturePath)
  }

  /**
   * 更新GUI控件中，灯光位移范围
   */
  updateLightRange() {
    const size = this.sceneManager.getSize()
    const center = this.sceneManager.getCenter()

    const range = Math.ceil(Math.max(size.x, size.y, size.z)) * 4

    const x = Math.ceil(center.x)
    const y = Math.ceil(center.y)
    const z = Math.ceil(center.z)

    this.controller.dirLightX.min(x - range).max(x + range)
    this.controller.dirLightY.min(0).max(y + range)
    this.controller.dirLightZ.min(z - range).max(z + range)

    this.controller.dirLightX.updateDisplay()
    this.controller.dirLightY.updateDisplay()
    this.controller.dirLightZ.updateDisplay()
  }

  /**
   * 更新GUI控件内容，不同大小的模型对应场景的设置不同，需要动态配置
   *
   * 在模型变化后调用
   */
  updateGUI(){
    this.updateLightRange()
  }

  showGUI() {
    if (!this.gui) return
    this.gui.show()

    this.isShow = true
  }

  hideGUI() {
    if (!this.gui) return
    this.gui.hide()

    this.isShow = false
  }

  toggleGUI() {
    this.isShow ? this.hideGUI() : this.showGUI()
  }

  /**
   * 销毁GUI
   * @returns
   */
  dispose() {
    if (!this.gui) return

    this.controller = {
      dirLightX: null,
      dirLightY: null,
      dirLightZ: null
    }

    this.gui.destroy()
    this.gui = null

    this.sceneManager = null

    this.isShow = false
  }
}
