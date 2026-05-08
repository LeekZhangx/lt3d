import { TextureFace } from "./TextureFace.js"

/**
 * 6个贴图面的对象实例
 * 
 * 分别为 
 * px   nx    py  ny    pz    nz
 * 
 * East West  Up  Down  South North
 */
export class TextureFaces {

  constructor({px, nx, py, ny, pz, nz}) {

    this.px = px ?? new TextureFace()
    this.nx = nx ?? new TextureFace()

    this.py = py ?? new TextureFace()
    this.ny = ny ?? new TextureFace()

    this.pz = pz ?? new TextureFace()
    this.nz = nz ?? new TextureFace()
  }

  clone() {

    const f = new TextureFaces()

    f.px = this.px.clone()
    f.nx = this.nx.clone()

    f.py = this.py.clone()
    f.ny = this.ny.clone()

    f.pz = this.pz.clone()
    f.nz = this.nz.clone()

    return f
  }
}