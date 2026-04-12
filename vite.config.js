import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  build: {
    outDir: 'docs',

    // lib: {
    //   entry: './src/index.js',
    //   name: 'Lt3D',
    //   formats: ['es', 'umd'],
    //   fileName: (format) => `lt3d.${format}.js` 
    // },

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
        entryFileNames: `lt3d.js`,
        chunkFileNames: `lt3d.js`,
        assetFileNames: `lt3d.[ext]`,

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