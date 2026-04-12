/**
 * lil-gui 主题工具类
 *
 * @example
 *   GuiTheme.apply(gui, GuiTheme.THEME.GREEN)
 *   GuiTheme.apply(gui, 'blue')
 *   GuiTheme.apply(gui, { background: '#000' })
 */
export class GuiTheme {

  /**
   * 主题枚举
   */
  static THEME = Object.freeze({
    DARK: 'dark',
    BLUE: 'blue',
    GREEN: 'green',
    CYAN: 'cyan',
    WARM: 'warm',
    PURPLE: 'purple',
    LIGHT: 'light'
  })

  /**
   * 内置主题
   */
static THEME_PRESET = {

  dark: {
    background: '#0f141a',

    titleBg: '#1e293b',
    titleColor: '#e5e7eb',

    textColor: '#94a3b8',

    widgetColor: '#273449',
    hoverColor: '#2a3442',

    folderBgLevel1: '#18212c',
    folderBgLevel2: '#1c2532',
    folderBgLevel3: '#202a38',

    numberColor: '#7aa2f7',

    controllerBgLevel1: '#1f2a3b',
    controllerBgLevel2: '#232e42',
    controllerBgLevel3: '#273449'
  },

  blue: {
    background: '#0c1324',

    titleBg: '#3b82f6',
    titleColor: '#eaf2ff',

    textColor: '#a5b4fc',

    widgetColor: '#223a7a',
    hoverColor: '#355fb8',

    folderBgLevel1: '#1a2a55',
    folderBgLevel2: '#1d3263',
    folderBgLevel3: '#223a7a',

    numberColor: '#7aa2f7',

    controllerBgLevel1: '#1f326b',
    controllerBgLevel2: '#213576',
    controllerBgLevel3: '#223a7a'
  },

  green: {
    background: '#0f2e22',

    titleBg: '#22c55e',
    titleColor: '#ecfdf5',

    textColor: '#86efac',

    widgetColor: '#1f513a',
    hoverColor: '#2f7a55',

    folderBgLevel1: '#163d2c',
    folderBgLevel2: '#1a4733',
    folderBgLevel3: '#1f513a',

    numberColor: '#4ade80',

    controllerBgLevel1: '#184a36',
    controllerBgLevel2: '#1b523b',
    controllerBgLevel3: '#1f513a'
  },

  purple: {
    background: '#140f1f',

    titleBg: '#a855f7',
    titleColor: '#f3e8ff',

    textColor: '#d8b4fe',

    widgetColor: '#5b2a86',
    hoverColor: '#7b4bb3',

    folderBgLevel1: '#3f1c63',
    folderBgLevel2: '#4a2372',
    folderBgLevel3: '#5b2a86',

    numberColor: '#c084fc',

    controllerBgLevel1: '#451f6f',
    controllerBgLevel2: '#502585',
    controllerBgLevel3: '#5b2a86'
  },

  cyan: {
    background: '#071c1c',

    titleBg: '#06b6d4',
    titleColor: '#ecfeff',

    textColor: '#67e8f9',

    widgetColor: '#1f6b75',
    hoverColor: '#2c8e97',

    folderBgLevel1: '#174e52',
    folderBgLevel2: '#1b5a60',
    folderBgLevel3: '#1f6b75',

    numberColor: '#22d3ee',

    controllerBgLevel1: '#19666c',
    controllerBgLevel2: '#1d737a',
    controllerBgLevel3: '#1f6b75'
  },

  warm: {
    background: '#1c120d',

    titleBg: '#f97316',
    titleColor: '#fff7ed',

    textColor: '#fdba74',

    widgetColor: '#7a3a1d',
    hoverColor: '#c96a2c',

    folderBgLevel1: '#4a1f0f',
    folderBgLevel2: '#5a2815',
    folderBgLevel3: '#7a3a1d',

    numberColor: '#fb923c',

    controllerBgLevel1: '#5c301c',
    controllerBgLevel2: '#693821',
    controllerBgLevel3: '#7a3a1d'
  },

  light: {
    background: '#f9fafb',

    titleBg: '#3b82f6',
    titleColor: '#ffffff',

    textColor: '#4b5563',

    widgetColor: '#f3f4f6',
    hoverColor: '#eef0f3',

    folderBgLevel1: '#f3f4f6',
    folderBgLevel2: '#e5e7eb',
    folderBgLevel3: '#d1d5db',

    numberColor: '#2563eb',

    controllerBgLevel1: '#f0f1f4',
    controllerBgLevel2: '#e2e4e8',
    controllerBgLevel3: '#d1d5db'
  }

}

  /**
   * 应用主题
   *
   * - 在创建完整个GUI后调用！！！
   *
   * @param {GUI} gui
   * @param {string|Object} themeNameOrObject
   */
  static apply(gui, themeNameOrObject) {
    if (!gui) return

    let theme = {}

    if (typeof themeNameOrObject === 'string') {
      theme = this.THEME_PRESET[themeNameOrObject] || this.THEME_PRESET.dark
    } else {
      theme = themeNameOrObject
    }

    const el = gui.domElement

    // lil-gui 实际使用变量
    const map = {
      background: '--background-color',
      titleBg: '--title-background-color',
      titleColor: '--title-text-color',
      textColor: '--text-color',
      widgetColor: '--widget-color',
      hoverColor: '--hover-color',
      folderBg: '--folder-background-color',
      numberColor: '--number-color',

      background2: '--lil-gui-background-color',
      textColor2: '--lil-gui-text-color',
      titleBg2: '--lil-gui-title-background-color',
      widgetColor2: '--lil-gui-widget-color',
      hoverColor2: '--lil-gui-hover-color',
      numberColor2: '--lil-gui-number-color'
    }

    // ===== 1. 设置主题变量 =====
    Object.entries(map).forEach(([key, cssVar]) => {
      const realKey = key.replace('2', '')
      if (theme[realKey]) {
        el.style.setProperty(cssVar, theme[realKey])
      }
    })

    // ===== 2. 层级 Folder 增强（核心升级）=====
    this.applyFolderLevels(el, theme)
  }

static applyFolderLevels(root, theme) {
  const processGui = (guiEl, level = 0) => {
    // 背景颜色
    const bg =
      theme[`folderBgLevel${level + 1}`] || theme.folderBg;
    const ctrlBg =
      theme[`controllerBgLevel${level + 2}`] || theme.controllerBg || bg; // 控件单独颜色

    // lil-children 背景
    const children = guiEl.querySelector(':scope > .lil-children');
    if (children && bg) children.style.background = bg;

    // lil-title 背景和文字颜色
    const title = guiEl.querySelector(':scope > .lil-title');
    if (title && bg) {
      title.style.background = bg;
      if (theme.titleColor) title.style.color = theme.titleColor;

      if (!title.__themed) {
        title.addEventListener('mouseenter', () => {
          title.style.background = theme.hoverColor || bg;
        });
        title.addEventListener('mouseleave', () => {
          title.style.background = bg;
        });
        title.__themed = true;
      }
    }

    // 控件背景颜色
    if (children) {
      const controllers = children.querySelectorAll(':scope > .lil-controller');
      controllers.forEach(ctrl => {
        if (ctrlBg) ctrl.style.background = ctrlBg;
      });
    }


    // 递归处理子文件夹
    const nestedFolders = children?.querySelectorAll(':scope > .lil-gui');
    if (nestedFolders) {
      nestedFolders.forEach(child => processGui(child, level + 1));
    }
  };

  // 从根开始处理所有子文件夹
  const rootFolders = root.querySelectorAll(':scope > .lil-children > .lil-gui');
  rootFolders.forEach(guiEl => processGui(guiEl, 0));
}

  /**
   * 获取所有主题名称
   */
  static getThemeNames() {
    return Object.keys(this.THEME_PRESET)
  }

}
