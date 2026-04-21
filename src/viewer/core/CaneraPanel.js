import GUI from "lil-gui"
import { GuiTheme } from "../util/GuiTheme"

export class CameraPanel {

  constructor({ getType, onSwitch }) {
    this.getType = getType
    this.onSwitch = onSwitch

    this.isShow = false
    this.gui = null
  }

  enableGUI(container, guiTheme) {

    this.gui = new GUI({ 
      title: 'Camera',
      container 
    })

    const state = {
      type: this.getType()
    }

    this.gui
      .add(state, 'type', ['perspective', 'orthographic'])
      .name('Camera Type')
      .onChange((v) => {
        this.onSwitch(v)
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

    this.getType = getType
    this.onSwitch = onSwitch

    this.gui.destroy()
    this.gui = null

    this.isShow = false
  }
}