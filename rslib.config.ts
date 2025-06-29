import { defineConfig } from '@rslib/core'
const minify = import.meta.env.MINIFY === 'true'
const sourceMap = import.meta.env.SCROUPMAP === 'true'
export default defineConfig({
  lib: [
    {
      format: 'esm',
      syntax: 'esnext',
      dts: {
        bundle: true,
        distPath: './dist'
      },
      autoExternal: {
        dependencies: false,
        optionalDependencies: true,
        peerDependencies: true,
        devDependencies: false
      },
      output: {
        target: 'web',
        cleanDistPath: true,
        distPath: {
          root: './dist'
        },
        sourceMap: sourceMap,
        minify: minify
      }
    }
  ]
})
