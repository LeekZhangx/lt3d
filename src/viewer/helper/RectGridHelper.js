import {
  LineSegments,
  LineBasicMaterial,
  BufferGeometry,
  Float32BufferAttribute,
  Color
} from 'three'

/**
 * 矩形的GridHelper
 */
class RectGridHelper extends LineSegments {

  constructor(
    width = 10,
    height = 10,
    widthDivisions = 10,
    heightDivisions = 10,
    color1 = 0x444444,
    color2 = 0x888888
  ) {

    color1 = new Color(color1)
    color2 = new Color(color2)

    const halfW = width / 2
    const halfH = height / 2

    const stepX = width / widthDivisions
    const stepZ = height / heightDivisions

    const centerX = widthDivisions / 2
    const centerZ = heightDivisions / 2

    const vertices = []
    const colors = []

    let j = 0

    // ---- 横线（平行 X 轴，沿 Z 排列）----
    for (let i = 0, z = -halfH; i <= heightDivisions; i++, z += stepZ) {

      vertices.push(-halfW, 0, z, halfW, 0, z)

      const color = i === centerZ ? color1 : color2

      color.toArray(colors, j); j += 3
      color.toArray(colors, j); j += 3
    }

    // ---- 竖线（平行 Z 轴，沿 X 排列）----
    for (let i = 0, x = -halfW; i <= widthDivisions; i++, x += stepX) {

      vertices.push(x, 0, -halfH, x, 0, halfH)

      const color = i === centerX ? color1 : color2

      color.toArray(colors, j); j += 3
      color.toArray(colors, j); j += 3
    }

    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3))
    geometry.setAttribute('color', new Float32BufferAttribute(colors, 3))

    const material = new LineBasicMaterial({
      vertexColors: true,
      toneMapped: false
    })

    super(geometry, material)

    this.type = 'RectGridHelper'
  }

  dispose() {

    this.geometry.dispose()
    this.material.dispose()

  }

}

export { RectGridHelper }
