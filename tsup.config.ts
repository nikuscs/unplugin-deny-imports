import { defineConfig } from 'tsup'

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/vite.ts',
    'src/bun.ts',
    'src/rollup.ts',
    'src/webpack.ts',
    'src/esbuild.ts',
    'src/presets.ts',
  ],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  splitting: false,
})
