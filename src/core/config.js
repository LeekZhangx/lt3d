import { LT_VERSION } from "./version/LtVersion.js";

const LOCAL_BASE = "./assets"
const CDN_BASE = ""

const USE_CDN = false

/**
 * 纹理贴图路径配置表（Texture Path Mapping）
 *
 * 用于根据不同的 LT 版本，映射对应的贴图资源根目录。
 *
 * 使用场景：
 * - txt → 3D 解析过程中，根据版本加载不同资源
 * - 材质解析（Material Resolver）
 * - 贴图加载（TextureLoader / TextureCache）
 *
 * 使用示例：
 * ```js
 * const basePath = TEXTURE_PATH_CONFIG[version]
 * const textureUrlv1_12 = `${basePath}/${modName}/blocks/${textureName}.png` //1.12
 * const textureUrlv1_21 = `${basePath}/${modName}/block/${textureName}.png`  //1.21
 * ```
 *
 * 注意事项：
 * - key 必须为 LT_VERSION 枚举值
 * - value 应为贴图资源的根路径（不包含具体文件名）
 * - 路径建议使用绝对路径或可访问的静态资源路径
 * - 根路径目录下的文件，需要 ‘mod名称 / blocks或者block / 贴图名称.png’ 这样的路径结构，和mc提供的jar包下的texture路径一致
 * - 对于1.12版本，还需要自行设置 BlockTextureTable_v1.12.js ,为每个 方块 和 贴图 关联
 * - 对于1.21版本，虽然命名方式采用扁平化，但不是每个方块名称直接对应贴图名称，需要自行命名补充
 *
 * @type {Readonly<Record<string, string>>}
 */
export const TEXTURE_PATH_CONFIG = Object.freeze({

  [LT_VERSION.V_1_12] : (USE_CDN ? CDN_BASE : LOCAL_BASE) +  "/texture-1.12",
  [LT_VERSION.V_1_21] : (USE_CDN ? CDN_BASE : LOCAL_BASE) +  "/texture-1.21"

})
