import { FCB_DATA_1_12 } from './data/fcbData_1.12.js'

/**
 * FCB(Flat Colored Blocks) 方块信息转换
 * - 需要存放转换数据的.json文件
 * - 提供颜色叠加信息
 *
 */
export class FcbTransfer{

  /**
   * @typedef {object} FcbData
   * @property {object[]} title 标题
   * @property {object[]} common 普通不透明染色方块
   * @property {object[]} light 发光染色方块
   * @property {object[]} transparent 透明染色方块
   */

  /**
   * FCB提供的CSV文件经过处理的数据
   * - 将 标题 和 不同类型的 方块 区分
   * @type {FcbData}
   */
  static DATA = null;


  /**
   * 获取FCB提供的默认配置的颜色等信息
   * @return {FcbData|null}
   */
  static getData(){

    if (this.DATA !== null)return this.DATA;

    let tmp =  this._getDataFromJson(FCB_DATA_1_12);

    let len = tmp.data.length / 3;//1.12有3种不同类型的染色方块

    this.DATA = {
        title: tmp.title,
        common: tmp.data.slice(0, len),
        transparent: tmp.data.slice(len, len * 2),
        glowing: tmp.data.slice(len * 2),
    }
    console.log(this.DATA);

    return this.DATA;
  }



  /**
   * 将json数据格式化
   * @param {string[][]} arr
   * @returns
   */
  static _getDataFromJson(arr){
    if (this.DATA !== null)return this.DATA;

    const title = arr[0]
    const data = arr.slice(1)
    const indexMap = this._buildIndexMap(title)

    return {
      title,
      indexMap,
      data
    }

  }

  /**
   * 构建 数据标题 index
   * @param {string[]} title
   * @returns
   */
  static _buildIndexMap(title) {
    const map = {}
    title.forEach((key, i) => {
      map[key] = i
    })
    return map
  }

  /**
   * @typedef {Object} FcbData
   * @property {number} [shadeNumber] index
   * @property {number} [name] 方块名称 如 'Dark Red Block #0'
   * @property {number} [hex] RGB 16进制 如 '#332828'
   * @property {number} [red] 0-255
   * @property {number} [blue] 0-255
   * @property {number} [green] 0-255
   * @property {number} [hue]
   * @property {number} [saturation]
   * @property {number} [value]
   * @property {number} [opacity] 0-100
   * @property {number} [lightValue] 0-15
   */

  /**
   * 根据命名空间获取该方块的相应属性<br>
   * FCB完整的命名空间如下 <br>
   * - 'flatcoloredblocks:flatcoloredblock50:3'
   * - 'flatcoloredblocks:flatcoloredblock_transparent0_57:8'
   * - 'flatcoloredblocks:flatcoloredblock_glowing0_66:6'
   * @param {string} blockNamespace
   * @returns {FcbData}
   */
  static getBlockDetail(blockNamespace){
    if(!this.DATA) {
      this.getData()
    }

    let names = blockNamespace.split(':');
    let blockName = names[1];
    let metaData =  Number.isInteger(Number(names[2])) ? names[2] : 0;

    let blockNum = Number(blockName.match(/\d+/g).pop());
    let n = blockNum * 16 + Number(metaData);
    let info;


    if (blockName.indexOf('transparent') > 0){
        //半透明方块

        info = this.DATA.transparent[ n ];
    }else if (blockName.indexOf('glowing') > 0) {
        //发光方块

        info = this.DATA.glowing[ n ];
    }else{
        //普通方块

        info = this.DATA.common[ n ];
    }


    return this._toFcbData(info);
  }

  /**
   * 将数据数组转换成带有属性名称的对象
   * @param {object[]} info
   * @returns
   */
  static _toFcbData(info) {
    return {
      shadeNumber: info[0],
      name: info[1],
      hex: info[2],
      red: info[3],
      green: info[4],
      blue: info[5],
      hue: info[6],
      saturation: info[7],
      value: info[8],
      opacity: info[9],
      lightValue: info[10],
    }
  }

  static dispose(){
    this.DATA = null
  }

}

