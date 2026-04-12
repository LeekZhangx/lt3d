import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    outDir: 'dist',

    lib: {
      entry: './src/index.js',
      name: 'Lt3D',
      formats: ['es', 'umd'],
      fileName: (format) => `lt3d.${format}.js` 
    },

    rollupOptions: {
      external: (id) => {
        return (
          id === 'three' ||
          id.startsWith('three/') ||
          id === 'three-mesh-bvh' ||
          id === 'three-bvh-csg' ||
          id === 'lil-gui'
        )
      },

      output: {
        globals: {
          three: 'THREE',
          'three-mesh-bvh': 'MeshBVHLib',
          'three-bvh-csg': 'ThreeBvhCsg',
          'lil-gui': 'lil'
        }
      }
    }
  }
})