import GUI from "lil-gui"
import { GuiTheme } from "../gui/GuiTheme"
import { CameraController } from "./CameraController"

export class CameraPanel {

  /**
   * 
   * @param {CameraController} cameraController 
   */
  constructor(cameraController) {
    this.controller = cameraController

    this.isShow = false
    this.gui = null
  }

  enableGUI(container, guiTheme) {

    this.gui = new GUI({ 
      title: 'Camera',
      container 
    })

    const state = {
      type: this.controller.getType()
    }

    this.gui
      .add(state, 'type', ['perspective', 'orthographic'])
      .name('Camera Type')
      .onChange((v) => {
        this.controller.switchCamera(v)
      })

    const theme = guiTheme ?? GuiTheme.THEME.BLUE
    GuiTheme.apply(this.gui, theme)

    this.isShow = true
  }

  showGUI() {
    this.gui?.show()
    this.isShow = true
  }

  hideGUI() {
    this.gui?.hide()
    this.isShow = false
  }

  /**
   * 销毁GUI
   * @returns
   */
  dispose() {
    if (!this.gui) return

    this.gui.destroy()
    this.gui = null

    this.controller = null

    this.isShow = false
  }
}