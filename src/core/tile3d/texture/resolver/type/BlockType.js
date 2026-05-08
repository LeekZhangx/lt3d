/**
 * 方块类型，用于方块的 纹理贴图 和 面的映射
 */
export const BlockType = /** @type {const} */ Object.freeze({

  /**
   * 普通立方体
   * 六面直接映射
   */
  CUBE: 'cube',

  CUBE_ALL: 'cube_all',

  CUBE_BOTTOM_ALL: 'cube_bottom_top',

  /**
   * 柱体
   * side/end + axis
   */
  CUBE_COLUMN: 'cube_column',

  /**
   * 水平柱体
   */
  CUBE_COLUMN_HORIZONTAL: 'cube_column_horizontal',

  CUBE_DIRECTIONAL: 'cube_directional',

  /**
   * 可朝向方块
   */
  ORIENTABLE: 'orientable',

  ORIENTABLE_VERTICAL: 'orientable_vertical',

  /**
   * 彩釉陶瓦
   * 面旋转映射
   */
  GLAZED_TERRACOTTA: 'glazed_terracotta',

})