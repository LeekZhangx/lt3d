import { GUI } from 'lil-gui'
import { GuiTheme } from '../gui/GuiTheme.js'
import { SCENE_CONFIG } from '../config/config.js'
import { SceneController } from './SceneController.js'

/**
 * 场景环境 GUI 控制面板
 *
 * - 调整灯光位置
 * - 替换地面贴图
 */
export class ScenePanel {

  /**
   * 实例化 场景环境 GUI 控制面板
   * 
   * 需要调用 enableGUI 实现数据填充和关联
   */
  constructor() {

    /** @type {SceneController} */
    this.controller = null

    this.gui = null

    /**
     * 当前GUI是否显示
     */
    this.isShow = false

    this.controls = {
      dirLightX: null,
      dirLightY: null,
      dirLightZ: null
    }

  }

  /**
   * 启用GUI
   *
   * @param {SceneController} controller SceneController 场景控制器
   * @param {HTMLDivElement} container GUI 挂载的 DOM 容器
   * @param {keyof GuiTheme.THEME} [guiTheme] gui主题， 获取自 GuiTheme.THEME
   * @returns
   */
  enableGUI(controller, container, guiTheme) {
    if (this.gui) return

    this.gui = new GUI({
      title: 'Scene',
      container
    })

    this.controller = controller

    // ===== 定向光 =====
    const directLightState = this.controller.getDirectLightState()


    const directLightFolder = this.gui.addFolder('Direct Light')

    directLightFolder.add(directLightState, 'intensity', 0, 5, 0.1)
      .onChange(v => {
        this.controller.updateDirectLightIntensity(v)
    })

    this.controls.dirLightX = directLightFolder.add(directLightState, 'x', -10, 10)
      .onChange(v => {
        this.controller.updateDirectLightPosition({ x: v })
    })
    this.controls.dirLightY = directLightFolder.add(directLightState, 'y', 0, 50)
      .onChange(v => {
        this.controller.updateDirectLightPosition({ y: v })
    })
    this.controls.dirLightZ = directLightFolder.add(directLightState, 'z', -10, 10)
      .onChange(v => {
        this.controller.updateDirectLightPosition({ z: v })
    })

    // ===== 环境光 =====
    const ambientLightFolder = this.gui.addFolder('Ambient Light')

    const ambientLightState = this.controller.getAmbientLightState()

    ambientLightFolder.add(ambientLightState, 'intensity', 0, 5, 0.1)
      .onChange(v => {
        this.controller.updateAmbientLightIntensity(v)
    })

    // ===== 地面 =====
    const groundState = this.controller.getGroundState()

    const groundFolder = this.gui.addFolder('Ground Plane')

    //地面可视
    groundFolder.add(groundState, 'visible')
      .name('visible')
      .onChange(v => {
        this.controller.updateGroundVisible(v)
      })


    // 地面大小
    groundFolder.add(groundState, 'scale', 1, 100)
      .name('scale')
      .step(1)
      .onChange(v => {
        this.controller.updateGroundScale(v)
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
        this.controller.updateGroundTexture(tex.path, tex.color )
      })

    this.controller.applySceneState({
      directLightState,
      ambientLightState,
      groundState
    })  

    this.updateGUI()

    const theme = guiTheme ?? GuiTheme.THEME.GREEN
    GuiTheme.apply(this.gui, theme)
    this.isShow = true
  }


  /**
   * 更新GUI控件中，灯光位移范围
   */
  updateLightRange() {
    const range = this.controller.getLightRange()
    if (!range) return

    this.controls.dirLightX.min(range.x[0]).max(range.x[1])
    this.controls.dirLightY.min(range.y[0]).max(range.y[1])
    this.controls.dirLightZ.min(range.z[0]).max(range.z[1])

    this.controls.dirLightX.updateDisplay()
    this.controls.dirLightY.updateDisplay()
    this.controls.dirLightZ.updateDisplay()
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

    this.controls = {
      dirLightX: null,
      dirLightY: null,
      dirLightZ: null
    }

    this.gui.destroy()
    this.gui = null

    this.controller = null

    this.isShow = false
  }
}
