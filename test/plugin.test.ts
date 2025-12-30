import { describe, it, expect, vi } from 'vitest'
import { build, type InlineConfig } from 'vite'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import denyImports from '../src/vite'
import type { Options } from '../src/index'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function createBuildConfig(fixture: string, options: Options, ssr = false): InlineConfig {
  return {
    root: path.join(__dirname, 'fixtures', fixture),
    logLevel: 'silent',
    build: {
      write: false,
      ssr: ssr ? 'index.js' : undefined,
      lib: ssr ? undefined : {
        entry: 'index.js',
        formats: ['es'],
      },
      rollupOptions: { logLevel: 'silent' },
    },
    plugins: [denyImports(options)],
  }
}

async function expectDenied(
  config: InlineConfig,
  assertions: { pattern?: string; specifier?: string; env?: string; file?: string }
) {
  try {
    await build(config)
    expect.fail('Should have thrown')
  } catch (e) {
    const message = (e as Error).message
    expect(message).toContain('Import Denied')
    if (assertions.pattern) expect(message).toContain(assertions.pattern)
    if (assertions.specifier) expect(message).toContain(assertions.specifier)
    if (assertions.env) expect(message).toContain(assertions.env)
    if (assertions.file) expect(message).toContain(assertions.file)
  }
}

describe('unplugin-deny-imports', () => {
  describe('specifier denial', () => {
    it('should deny imports matching string patterns', async () => {
      await expectDenied(
        createBuildConfig('deny-specifier', {
          client: { specifiers: ['denied-module'] },
        }),
        { pattern: 'denied-module', specifier: 'denied-module', env: 'client' }
      )
    })

    it('should deny imports matching glob patterns', async () => {
      await expectDenied(
        createBuildConfig('deny-glob', {
          client: { specifiers: ['@app/*/server'] },
        }),
        { pattern: '@app/*/server', specifier: '@app/auth/server', env: 'client' }
      )
    })

    it('should deny imports matching regex patterns', async () => {
      await expectDenied(
        createBuildConfig('deny-regex', {
          client: { specifiers: [/^node:/] },
        }),
        { specifier: 'node:fs', env: 'client' }
      )
    })

    it('should allow imports not matching patterns', async () => {
      const result = await build(createBuildConfig('allow-specifier', {
        client: { specifiers: ['some-other-module'] },
      }))
      expect(result).toBeDefined()
    })
  })

  describe('file path denial', () => {
    it('should deny imports matching file patterns', async () => {
      await expectDenied(
        createBuildConfig('deny-file', {
          client: { files: ['**/*.server.*'] },
        }),
        { pattern: '**/*.server.*', file: 'utils.server.js', env: 'client' }
      )
    })
  })

  describe('ignoreImporters', () => {
    it('should skip checks when importer matches ignore pattern', async () => {
      const result = await build(createBuildConfig('ignore-importer', {
        client: { specifiers: ['denied-module'] },
        ignoreImporters: ['**/*.test.*'],
      }))
      expect(result).toBeDefined()
    })
  })

  describe('directive enforcement', () => {
    it('should deny "use server" in client builds', async () => {
      try {
        await build(createBuildConfig('use-server', { directives: true }))
        expect.fail('Should have thrown')
      } catch (e) {
        const message = (e as Error).message
        expect(message).toContain('Directive Denied')
        expect(message).toContain('use server')
        expect(message).toContain('client')
      }
    })

    it('should allow "use client" in client builds', async () => {
      const result = await build(createBuildConfig('use-client', { directives: true }))
      expect(result).toBeDefined()
    })

    it('should skip directive checks when disabled', async () => {
      const result = await build(createBuildConfig('use-server', { directives: false }))
      expect(result).toBeDefined()
    })
  })

  describe('warn mode', () => {
    it('should warn instead of throwing when mode is warn', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const result = await build(createBuildConfig('deny-specifier', {
        client: { specifiers: ['denied-module'] },
        mode: 'warn',
      }))

      expect(result).toBeDefined()
      expect(warnSpy).toHaveBeenCalled()
      const warning = warnSpy.mock.calls[0][0] as string
      expect(warning).toContain('unplugin-deny-imports')
      expect(warning).toContain('denied-module')
      expect(warning).toContain('client')

      warnSpy.mockRestore()
    })
  })

  describe('server context (SSR)', () => {
    it('should deny server.specifiers in SSR builds', async () => {
      await expectDenied(
        createBuildConfig('server-deny-specifier', {
          server: { specifiers: ['react-dom/client'] },
        }, true),
        { pattern: 'react-dom/client', specifier: 'react-dom/client', env: 'server' }
      )
    })

    it('should deny server.files in SSR builds', async () => {
      await expectDenied(
        createBuildConfig('server-deny-file', {
          server: { files: ['**/*.client.*'] },
        }, true),
        { pattern: '**/*.client.*', file: 'utils.client.js', env: 'server' }
      )
    })

    it('should allow client-only patterns in SSR builds', async () => {
      const result = await build(createBuildConfig('deny-specifier', {
        client: { specifiers: ['denied-module'] },
      }, true))
      expect(result).toBeDefined()
    })
  })

  describe('maxDepth', () => {
    it('should include full trace when maxDepth is high', async () => {
      try {
        await build(createBuildConfig('deep-import', {
          client: { specifiers: ['denied-module'] },
          maxDepth: 10,
        }))
        expect.fail('Should have thrown')
      } catch (e) {
        const message = (e as Error).message
        expect(message).toContain('Import Denied')
        expect(message).toContain('denied-module')
        expect(message).toContain('a.js')
        expect(message).toContain('b.js')
        expect(message).toContain('c.js')
      }
    })

    it('should limit trace when maxDepth is low', async () => {
      try {
        await build(createBuildConfig('deep-import', {
          client: { specifiers: ['denied-module'] },
          maxDepth: 2,
        }))
        expect.fail('Should have thrown')
      } catch (e) {
        const message = (e as Error).message
        expect(message).toContain('Import Denied')
        expect(message).toContain('denied-module')
        expect(message).toContain('c.js')
        expect(message).not.toContain('index.js')
      }
    })
  })
})
