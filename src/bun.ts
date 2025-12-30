import { esbuildPlugin, type Options } from './index'

// Bun's plugin API is esbuild-compatible at runtime
// We re-type it for better DX
interface BunPlugin {
  name: string
  setup: (build: any) => void | Promise<void>
  target?: 'bun' | 'browser'
}

export default function bunPlugin(options?: Options): BunPlugin {
  return esbuildPlugin(options) as unknown as BunPlugin
}
