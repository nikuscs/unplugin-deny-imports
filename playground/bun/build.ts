import denyImports from '../../dist/bun.js'
import preset from '../../dist/presets.js'

const target = (process.argv[2] as 'client' | 'server') || 'client'

console.log(`Building for ${target}...`)

const result = await Bun.build({
  entrypoints: ['./src/main.ts'],
  outdir: './dist',
  target: target === 'client' ? 'browser' : 'bun',
  plugins: [denyImports({ ...preset, target })],
})

if (!result.success) {
  console.error('Build failed:')
  for (const log of result.logs) {
    console.error(log)
  }
  process.exit(1)
}
