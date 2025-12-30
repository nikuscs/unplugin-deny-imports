import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    exclude: ['test/bun.test.ts'],
  },
  resolve: {
    alias: {
      'unplugin-deny-imports': './src/index.ts',
      'unplugin-deny-imports/presets': './src/presets.ts',
    },
  },
})
