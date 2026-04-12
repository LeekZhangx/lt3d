import { Result } from '../util/Result.js'
import { ParseError, TokenizeError } from '../error/index.js'
import { ERROR_KEY } from '../error/ErrorKey.js'

/**
 * Lt txt文本 解析器，将txt字符串解析成ast对象
 */
export class BaseParser {

  /**
   * ============================================================
   * AstParser
   *
   * 职责：
   * 1. 将 LT / NBT 风格 txt 转换为 AST
   * 2. 只保证「语法正确 + 结构可解析」
   * 3. 不做任何语义校验、不拆字段、不解释含义
   *
   * 核心原则：
   * - Parser 必须足够“宽松”
   * - 非法语义留给 Semantic / Simplified 阶段
   * ============================================================
   */


  /**
   * lt txt 解析，转换成ast
   * @param {string} input
   * @param {object} options
   * @returns {Result}
   */
  static parse(input, options) {

    try {
      const tokens = this.tokenize(input)

      // console.log(tokens);

      const ast = this.parseTokens(tokens)

      // console.log(tokens);

      ast.ltVersion = options.ltVersion

      return Result.ok(ast)
    } catch (e) {
      console.error('Unexpected Error:', e)
      console.error('Type:', e.constructor.name)

      if (e instanceof ParseError || e instanceof TokenizeError) {
        return Result.err(e.key, {
          ...e.detail,
          path: e.path,
        })
      }

      // 非预期程序错误
      console.error(e)
      return Result.err(ERROR_KEY.UNKNOWN_ERROR, {
        message: e?.message,
      })
    }

  }

/**
 * ============================================================
 * 1. Tokenizer（词法分析）
 * ============================================================
 */

/**
 * 将输入字符串转为 token 流
 * @param {string} input
 * @returns {Array<{type: string, value?: any, raw?: string, pos: number}>}
 */
  static tokenize(input) {
    const tokens = []
      let i = 0

      const isWhitespace = (c) => /\s/.test(c)
      const isDigit = (c) => /[0-9]/.test(c)
      const isIdentifierStart = (c) => /[a-zA-Z_]/.test(c)
      const isIdentifierPart = (c) => /[a-zA-Z0-9_.]/.test(c)

      while (i < input.length) {
        const c = input[i]

        // ----------------------------------------------------------
        // 空白字符直接跳过
        // ----------------------------------------------------------
        if (isWhitespace(c)) {
          i++
          continue
        }

        // ----------------------------------------------------------
        // 单字符符号
        // ----------------------------------------------------------
        if ('{}[]:;,'.includes(c)) {
          tokens.push({ type: c, pos: i })
          i++
          continue
        }

        // ----------------------------------------------------------
        // 字符串字面量："xxx"
        // ----------------------------------------------------------
        if (c === '"') {
          let value = ''
          const start = i
          i++ // 跳过 "

          while (i < input.length && input[i] !== '"') {
            value += input[i++]
          }

          // 字符串未闭合
          if (i >= input.length) {
            throw new TokenizeError(
              ERROR_KEY.TOKENIZE_UNTERMINATED_STRING,
              { start },
              '', // tokenizer 阶段没有结构 path
            )
          }

          i++ // 跳过结尾 "
          tokens.push({
            type: 'String',
            value,
            pos: start,
          })
          continue
        }

        // ----------------------------------------------------------
        // 数字 / NBT 数字字面量
        // 支持：
        //   - 123
        //   - -10
        //   - 0.75
        //   - 0.7f
        //   - 1b / 0b
        //   - 15L
        //
        // 注意：
        //   - 此阶段【不解析为 Number】
        //   - 只保留 raw 字符串
        // ----------------------------------------------------------
        if (c === '-' || isDigit(c)) {
          const start = i
          let raw = c
          i++

          // 数字 / 小数部分
          while (isDigit(input[i]) || input[i] === '.') {
            raw += input[i++]
          }

          // NBT 后缀（b f d l，不区分大小写）
          if (/[bBdDfFlL]/.test(input[i])) {
            raw += input[i++]
          }

          tokens.push({
            type: 'NumberLiteral',
            raw,
            pos: start,
          })
          continue
        }

        // ----------------------------------------------------------
        // 标识符（key / Identifier / TypedArray 前缀）
        // ----------------------------------------------------------
        if (isIdentifierStart(c)) {
          const start = i
          let value = c
          i++

          while (isIdentifierPart(input[i])) {
            value += input[i++]
          }

          tokens.push({
            type: 'Identifier',
            value,
            pos: start,
          })
          continue
        }

        // ----------------------------------------------------------
        // 非法字符
        // ----------------------------------------------------------
        throw new TokenizeError(ERROR_KEY.TOKENIZE_INVALID_CHAR, { char: c, pos: i }, '')
      }

      return tokens
  }

  static parseTokens(tokens) {
    return new Parser(tokens).parse()
  }
}

/**
 * ============================================================
 * 2. Parser（语法分析）
 * ============================================================
 */

class Parser {
  constructor(tokens) {
    this.tokens = tokens
    this.pos = 0
  }

  peek() {
    return this.tokens[this.pos]
  }

  consume(type) {
    const token = this.peek()

    if (!token) {
      throw new ParseError(ERROR_KEY.PARSER_UNEXPECTED_EOF, { expected: type }, '')
    }

    if (token.type !== type) {
      throw new ParseError(
        ERROR_KEY.PARSER_EXPECTED_TOKEN,
        {
          expected: type,
          got: token.type,
          pos: token.pos,
        },
        '',
      )
    }

    this.pos++
    return token
  }

  /**
   * 解析入口
   */
  parse() {
    return this.parseValue()
  }

  /**
   * Value 统一解析入口
   */
  parseValue() {
    const t = this.peek()

    if (!t) {
      throw new ParseError(ERROR_KEY.PARSER_UNEXPECTED_EOF, {}, '')
    }

    if (t.type === '{') return this.parseObject()
    if (t.type === '[') return this.parseArrayOrTypedArray()

    if (t.type === 'NumberLiteral') {
      return {
        type: 'NumberLiteral',
        raw: this.consume('NumberLiteral').raw,
      }
    }

    if (t.type === 'String') {
      return {
        type: 'String',
        value: this.consume('String').value,
      }
    }

    if (t.type === 'Identifier') {
      return {
        type: 'Identifier',
        value: this.consume('Identifier').value,
      }
    }

    throw new ParseError(ERROR_KEY.PARSER_UNEXPECTED_TOKEN, { token: t.type, pos: t.pos }, '')
  }

  /**
   * 数组 / TypedArray
   * 支持：
   *   [] / [a,b] / [I;1,2,3]
   */
  parseArrayOrTypedArray() {
    this.consume('[')

    // 空数组
    if (this.peek()?.type === ']') {
      this.consume(']')
      return { type: 'Array', elements: [] }
    }

    // TypedArray：[I;1,2,3]
    if (this.peek()?.type === 'Identifier' && this.tokens[this.pos + 1]?.type === ';') {
      return this.parseTypedArray()
    }

    // 普通数组
    const elements = []

    while (true) {
      const t = this.peek()
      if (!t) {
        throw new ParseError(ERROR_KEY.PARSER_UNEXPECTED_EOF, { expected: ']' }, '')
      }
      if (t.type === ']') break

      elements.push(this.parseValue())

      if (this.peek()?.type === ',') this.consume(',')
    }

    this.consume(']')
    return {
      type: 'Array',
      elements,
    }
  }

  /**
   * TypedArray
   * 示例：
   *   [I;1,2,3]
   *   [I;]
   *
   * 注意：
   *   values 内部保存 raw 字符串
   */
  parseTypedArray() {
    const arrayType = this.consume('Identifier').value
    this.consume(';')

    const values = []

    while (true) {
      const t = this.peek()
      if (!t) {
        throw new ParseError(ERROR_KEY.PARSER_UNEXPECTED_EOF, { expected: ']' }, '')
      }
      if (t.type === ']') break

      if (t.type !== 'NumberLiteral') {
        throw new ParseError(ERROR_KEY.PARSER_UNEXPECTED_TOKEN, { token: t.type, pos: t.pos }, '')
      }

      const raw = this.consume('NumberLiteral').raw

      /**
       * TypedArray 语义约定：
       * - 只接受“可被解析的数字”
       * - 无后缀 / 带后缀都在此阶段统一转为 number
       */
      const num = Number(raw.replace(/[bBdDfFlL]$/, ''))

      if (Number.isNaN(num)) {
        throw new ParseError(ERROR_KEY.PARSER_INVALID_NUMBER, { raw }, '')
      }

      values.push(num)

      if (this.peek()?.type === ',') this.consume(',')
    }

    this.consume(']')
    return {
      type: 'TypedArray',
      arrayType,
      values, // number[]
    }
  }

  /**
   * Object
   * 示例：
   *   { a: 1, b: {} }
   */
  parseObject() {
    this.consume('{')

    const properties = {}

    while (true) {
      const t = this.peek()
      if (!t) {
        throw new ParseError(ERROR_KEY.PARSER_UNEXPECTED_EOF, { expected: '}' }, '')
      }
      if (t.type === '}') break

      let key
      //支持自定义字符串为 key
      if (t.type === 'Identifier') {
        key = this.consume('Identifier').value
      } else if (t.type === 'String') {
        key = this.consume('String').value
      } else {
        throw new ParseError(
          ERROR_KEY.PARSER_EXPECTED_TOKEN,
          {
            expected: 'Identifier | String',
            got: t.type,
            pos: t.pos,
          },
          '',
        )
      }

      this.consume(':')
      properties[key] = this.parseValue()

      if (this.peek()?.type === ',') this.consume(',')
    }

    this.consume('}')
    return {
      type: 'Object',
      properties,
    }
  }
}
