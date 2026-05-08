/**
 * 贴图面对象，包含map和rot
 */
export class TextureFace {

  /**
   * 
   * @param {THREE.Texture} map 纹理贴图
   * @param {number} rot 纹理贴图旋转角度
   */
  constructor(map , rot){
    this.map = map
    this.rot = this._normalizeRot(rot)
  }

  _normalizeRot(rot){
    return ((rot % 360) + 360) % 360
  }

  setFace(map, rot){
    this.map = map
    this.rot = this._normalizeRot(rot)
  }

  /**
   * 添加旋转角度
   * @param {number} num 
   */
  rotate(num){
    this.rot = this.rot + this._normalizeRot(num)
  }

  getMap(){
    return this.map
  }

  getRot(){
    return this.rot
  }

  clone(){
    return new TextureFace(this.map, this.rot)
  }
}