import { describe, it, expect } from 'bun:test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import denyImports from '../src/bun'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

describe('unplugin-deny-imports (bun)', () => {
  it('should deny imports matching string patterns', async () => {
    const result = await Bun.build({
      entrypoints: [path.join(__dirname, 'fixtures/deny-specifier/index.js')],
      plugins: [
        denyImports({
          client: { specifiers: ['denied-module'] },
          target: 'client',
        }),
      ],
      throw: false,
    })

    expect(result.success).toBe(false)
    expect(result.logs.some(log => log.message?.includes('Import Denied'))).toBe(true)
  })

  it('should allow imports not matching patterns', async () => {
    const result = await Bun.build({
      entrypoints: [path.join(__dirname, 'fixtures/allow-specifier/index.js')],
      plugins: [
        denyImports({
          client: { specifiers: ['some-other-module'] },
          target: 'client',
        }),
      ],
      throw: false,
    })

    expect(result.success).toBe(true)
  })
})
