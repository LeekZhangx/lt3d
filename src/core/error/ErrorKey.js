/**
 * 所有错误 Key 的唯一来源
 * - 禁止在代码中手写字符串 key
 * - i18n 中必须 100% 覆盖这些 key
 */
export const ERROR_KEY = Object.freeze({
  /* ================= Tokenize ================= */

  /**
   * 字符串未正确闭合
   * detail: { start, pos }
   */
  TOKENIZE_UNTERMINATED_STRING: 'tokenize.unterminated_string',

  /**
   * 出现非法字符
   * detail: { char, pos }
   */
  TOKENIZE_INVALID_CHAR: 'tokenize.invalid_char',

  /**
   * 内容意外结束
   * detail: { pos }
   */
  TOKENIZE_UNEXPECTED_END: 'tokenize.unexpected_end',

  /* ================= Parser ================= */

  /**
   * 遇到无法识别的 token
   * detail: { token, pos }
   */
  PARSER_UNEXPECTED_TOKEN: 'parser.unexpected_token',

  /**
   * 标记不符合预期
   * detail: { expected, got, pos }
   */
  PARSER_EXPECTED_TOKEN: 'parser.expected_token',

  /**
   * 解析提前结束
   * detail: { expected }
   */
  PARSER_UNEXPECTED_EOF: 'parser.unexpected_eof',

  /**
   * AST 结构不合法
   * detail: { pos }
   */
  PARSER_INVALID_STRUCTURE: 'parser.invalid_structure',

  /**
   * 不合法的数字
   * detail : { object }
   */
  PARSER_INVALID_NUMBER: 'parser.invalid_num',

  /* ---------------- Transform / AST → JSON ---------------- */

  /**
   * Transform 阶段：AST 根节点非法
   * 期望 Object
   * detail: { actualType }
   */
  TRANSFORM_AST_INVALID_ROOT: 'transform.ast.invalid_root',

  /**
   * Transform 阶段：不支持的 AST 节点类型
   * detail: { nodeType }
   */
  TRANSFORM_AST_UNSUPPORTED_NODE: 'transform.ast.unsupported_node',

  /**
   * Transform 阶段：Object 节点 properties 非法
   */
  TRANSFORM_AST_OBJECT_INVALID_PROPERTIES: 'transform.ast.object.invalid_properties',

  /**
   * Transform 阶段：Object 属性缺少 key
   */
  TRANSFORM_AST_OBJECT_MISSING_KEY: 'transform.ast.object.missing_key',

  /**
   * Transform 阶段：Array 节点 items 非法
   */
  TRANSFORM_AST_ARRAY_INVALID_ITEMS: 'transform.ast.array.invalid_items',

  /**
   * Transform 阶段：Object 类型非法（期望 Object，但不是）
   */
  TRANSFORM_AST_OBJECT_INVALID: 'transform.ast.object.invalid',

  /**
   * Transform 阶段：Array 节点非法（期望 Array，但不是）
   */
  TRANSFORM_AST_ARRAY_INVALID: 'transform.ast.array.invalid',

  /**
   * Transform 阶段：TypedArray 节点非法（期望 TypedArray，但不是）
   */
  TRANSFORM_AST_TYPED_ARRAY_INVALID: 'transform.ast.typed_array.invalid',

  /**
   * Transform 阶段：TypedArray 节点 items 非法
   */
  TRANSFORM_AST_TYPED_ARRAY_INVALID_ITEMS: 'transform.ast.typed_array.invalid_items',

  /**
   * Transform 阶段：Number 节点值非法
   */
  TRANSFORM_AST_NUMBER_INVALID_VALUE: 'transform.ast.number.invalid_value',

  /* ================= Semantic ================= */

  /**
   * 语义阶段：LT 根节点非法
   * 期望 Object
   * detail: { actualType }
   */
  SEMANTIC_INVALID_ROOT: 'semantic.invalid_root',

  /**
   * tiles 字段类型非法
   * 期望 Array
   * detail: { actualType }
   */
  SEMANTIC_INVALID_TILES: 'semantic.invalid_tiles',

  /**
   * tile group 节点非法
   * tiles[i] 期望 Object
   * detail: { actualType }
   */
  SEMANTIC_INVALID_TILE_GROUP: 'semantic.invalid_tile_group',

  /**
   * boxes 与 bBox 同时存在（语义冲突）
   * 二者只能存在其一
   * detail: {}
   */
  SEMANTIC_BOXES_BBOX_CONFLICT: 'semantic.boxes_bbox_conflict',

  /**
   * tile group 中缺失 boxes / bBox
   * 必须存在其一
   * detail: {}
   */
  SEMANTIC_MISSING_BOXES: 'semantic.missing_boxes',

  /**
   * boxes 字段类型非法
   * 期望 Array
   * detail: { actualType }
   */
  SEMANTIC_INVALID_BOXES: 'semantic.invalid_boxes',

  /**
   * boxes 数组中的元素类型非法
   * 期望 TypedArray
   * detail: { actualType }
   */
  SEMANTIC_INVALID_BOXES_ELEMENT: 'semantic.invalid_boxes_element',

  /**
   * bBox 字段类型非法
   * 期望 TypedArray
   * detail: { actualType }
   */
  SEMANTIC_INVALID_BBOX: 'semantic.invalid_bbox',

  /**
   * tile 字段类型非法
   * 期望 Object
   * detail: { actualType }
   */
  SEMANTIC_INVALID_TILE: 'semantic.invalid_tile',

  /**
   * TypedArray 类型非法
   * detail: { actualType }
   */
  SEMANTIC_INVALID_TYPED_ARRAY: 'semantic.invalid_typed_array',

  /**
   * 数字字面量类型非法
   * 期望 NumberLiteral（支持 1.2f / 0b / -1 等）
   * detail: { actualType }
   */
  SEMANTIC_INVALID_NUMBER_LITERAL: 'semantic.invalid_number_literal',

  /**
   * 字符串类型非法
   * 期望 String
   * detail: { actualType }
   */
  SEMANTIC_INVALID_STRING: 'semantic.invalid_string',

  /* ================= Writer ================= */

  /**
   * 写回 txt 时 LT 根对象非法
   * detail: { actualType }
   */
  WRITER_INVALID_ROOT: 'writer.invalid_root',

  /**
   * writer 不支持的 JS 值类型
   * detail: { type }
   */
  WRITER_INVALID_VALUE_TYPE: 'writer.invalid_value_type',

  /**
   * 数组中存在 writer 不支持的元素
   * detail: { index, type }
   */
  WRITER_INVALID_ARRAY_VALUE: 'writer.invalid_array_value',

  /**
   * writer 阶段不支持 Function 类型
   * detail: { name }
   */
  WRITER_UNSUPPORTED_FUNCTION: 'writer.unsupported_function',

  /**
   * writer 阶段不支持 Symbol 类型
   * detail: { name }
   */
  WRITER_UNSUPPORTED_SYMBOL: 'writer.unsupported_symbol',

  /**
   * 写回 txt 时结构不支持
   * detail: { reason }
   */
  WRITER_UNSUPPORTED_STRUCTURE: 'writer.unsupported_structure',

  /**
   * 未知错误
   */
  UNKNOWN_ERROR: 'unknown_error',
})
