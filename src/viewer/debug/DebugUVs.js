import * as THREE from 'three'
import { UVsDebug } from 'three/examples/jsm/utils/UVsDebug'
import { UV_TEXTURE_PATH } from '../config/config';

export class DebugUVs{

    static test(container, name, geometry ) {

      const d = document.createElement( 'div' );

      d.innerHTML = '<h3>' + name + '</h3>';

      d.appendChild( UVsDebug( geometry, 512 ) );

      container.appendChild( d );

    }

    static debugPrintBoxFaces(geometry) {

      const pos = geometry.getAttribute('position')
      const uv = geometry.getAttribute('uv')
      const index = geometry.getIndex()

      if (!pos || !uv) {
        console.warn("Geometry is missing attribute 'position' or 'uv'")
        return
      }

      const faceNames = [
        '+X',
        '-X',
        '+Y',
        '-Y',
        '+Z',
        '-Z'
      ]

      for (let f = 0; f < 6; f++) {

        console.log(`\n====== Face ${f} (${faceNames[f]}) ======`)

        const startVertex = f * 4

        for (let v = 0; v < 4; v++) {

          const vi = startVertex + v

          const x = pos.getX(vi)
          const y = pos.getY(vi)
          const z = pos.getZ(vi)

          const u = uv.getX(vi)
          const v2 = uv.getY(vi)

          console.log(
            `vertex ${vi}`,
            {
              pos: [x, y, z],
              uv: [u, v2]
            }
          )
        }

        // 打印三角形
        if (index) {

          const startTri = f * 6

          const t1 = [
            index.getX(startTri + 0),
            index.getX(startTri + 1),
            index.getX(startTri + 2)
          ]

          const t2 = [
            index.getX(startTri + 3),
            index.getX(startTri + 4),
            index.getX(startTri + 5)
          ]

          console.log('triangles:', t1, t2)
        }
      }
    }

    /**
     *
     * @param {THREE.Scene} scene
     */
    static showUvBox(scene){

      const loader = new THREE.TextureLoader()
      const texture = loader.load(UV_TEXTURE_PATH)

      texture.colorSpace = THREE.SRGBColorSpace
      texture.magFilter = THREE.NearestFilter
      texture.minFilter = THREE.NearestFilter
      texture.wrapS = THREE.RepeatWrapping
      texture.wrapT = THREE.RepeatWrapping
      const mat = new THREE.MeshStandardMaterial({
              map: texture,
              color: new THREE.Color(1,1,1),
              transparent: false,
            })
      const geo = new THREE.BoxGeometry(4, 5, 6)
      const mesh = new THREE.Mesh(geo, mat)
      mesh.name = "uv-mesh"
      mesh.position.set(-5,2.5,-5)
      scene.add(mesh)
    }
}
