import * as THREE from 'three'

/**
 * 几何体的平面优化工具
 */
export class GeoFaceOptimizeUtli{

  /**
   * 优化变形后的 BoxGeometry
   *
   * - 删除重叠的三角形
   * - 删除退化的三角形
   *
   * @param {THREE.BoxGeometry} geo
   */
  static optimizeGeoFace(geo){
    this._removeDuplicateTriangles(geo)
    this._removeDegenerateTriangles(geo)
  }
    /**
   * 优化几何体，删除重叠的三角形
   * @param {*} geo
   * @returns
   */
  static _removeDuplicateTriangles(geo){

    const pos = geo.getAttribute('position').array
    const index = geo.getIndex().array

    const map = new Map()
    const eps = 1e-6

    function vKey(i){
      const x = Math.round(pos[i*3]/eps)
      const y = Math.round(pos[i*3+1]/eps)
      const z = Math.round(pos[i*3+2]/eps)
      return `${x}_${y}_${z}`
    }

    for(let i=0;i<index.length;i+=3){

      const a=index[i]
      const b=index[i+1]
      const c=index[i+2]

      const verts=[vKey(a),vKey(b),vKey(c)].sort()
      const key=verts.join('|')

      if(!map.has(key)){
        map.set(key,[])
      }

      map.get(key).push(i)
    }

    const newIndex=[]

    for(const list of map.values()){

      if(list.length===1){
        const i=list[0]
        newIndex.push(index[i],index[i+1],index[i+2])
      }
    }

    if(newIndex.length===0){
      geo.setIndex([])
    }else{
      geo.setIndex(new THREE.Uint32BufferAttribute(newIndex,1))
    }

  }

  /**
   * 删除退化的三角形
   * @param {*} geo
   */
  static _removeDegenerateTriangles(geo){

    const pos = geo.getAttribute('position').array
    const index = geo.getIndex().array

    const newIndex = []

    for(let i=0;i<index.length;i+=3){

      const a=index[i]
      const b=index[i+1]
      const c=index[i+2]

      const ax=pos[a*3], ay=pos[a*3+1], az=pos[a*3+2]
      const bx=pos[b*3], by=pos[b*3+1], bz=pos[b*3+2]
      const cx=pos[c*3], cy=pos[c*3+1], cz=pos[c*3+2]

      const ab = ax===bx && ay===by && az===bz
      const bc = bx===cx && by===cy && bz===cz
      const ca = cx===ax && cy===ay && cz===az

      if(!(ab || bc || ca)){
        newIndex.push(a,b,c)
      }
    }

    geo.setIndex(newIndex)
  }
}
