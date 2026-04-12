import * as THREE from 'three'

export class BlockMeshFactory{

  /**
   * 创造多材质的几何体mesh
   * @param {} geometry
   * @param {*} materials
   * @returns
   */
  static createMultiPassMesh(geometry, materials) {

    // 只有一个材质，没必要 Group
    if (materials.length === 1) {
      return new THREE.Mesh(geometry, materials[0])
    }

    const group = new THREE.Group()

    materials.forEach((material, index) => {
      const mesh = new THREE.Mesh(geometry, material)

      // === 关键规则 ===
      // overlay 层不写深度
      if (material.blending === THREE.MultiplyBlending) {
        mesh.renderOrder = 1
        mesh.material.depthWrite = false
      } else {
        mesh.renderOrder = 0
      }

      group.add(mesh)
    })

    return group
  }
}
