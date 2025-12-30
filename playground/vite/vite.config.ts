import { defineConfig } from 'vite'
import denyImports from '../../dist/vite.js'
import preset from '../../dist/presets.js'

export default defineConfig({
  plugins: [denyImports(preset)],
})
