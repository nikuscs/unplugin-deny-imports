import { describe, it, expect } from 'vitest'
import { defaultPreset, preset } from '../src/presets'

describe('presets', () => {
  describe('defaultPreset', () => {
    it('should have client specifiers for Node.js built-ins', () => {
      expect(defaultPreset.client.specifiers).toContain('fs')
      expect(defaultPreset.client.specifiers).toContain('crypto')
      expect(defaultPreset.client.specifiers).toContain('path')
    })

    it('should have client specifiers for databases', () => {
      expect(defaultPreset.client.specifiers).toContain('pg')
      expect(defaultPreset.client.specifiers).toContain('drizzle-orm')
      expect(defaultPreset.client.specifiers).toContain('@prisma/client')
    })

    it('should have client file patterns for .server files', () => {
      expect(defaultPreset.client.files).toContain('**/*.server.*')
      expect(defaultPreset.client.files).toContain('**/.server/**')
    })

    it('should have server file patterns for .client files', () => {
      expect(defaultPreset.server.files).toContain('**/*.client.*')
      expect(defaultPreset.server.files).toContain('**/.client/**')
    })

    it('should ignore test files by default', () => {
      expect(defaultPreset.ignoreImporters).toContain('**/*.test.*')
      expect(defaultPreset.ignoreImporters).toContain('**/*.spec.*')
    })
  })

  describe('preset()', () => {
    it('should return default preset when called without arguments', () => {
      const result = preset()

      expect(result.client.specifiers).toContain('fs')
      expect(result.client.files).toContain('**/*.server.*')
      expect(result.server.files).toContain('**/*.client.*')
    })

    it('should exclude specified string patterns', () => {
      const result = preset({
        exclude: ['drizzle-orm'],
      })

      expect(result.client.specifiers).not.toContain('drizzle-orm')
      expect(result.client.specifiers).toContain('pg') // others still present
    })

    it('should exclude specified regex patterns', () => {
      const nodeRegex = /^node:/
      const result = preset({
        exclude: [nodeRegex],
      })

      const hasNodeRegex = result.client.specifiers.some(
        (p) => p instanceof RegExp && p.source === nodeRegex.source
      )
      expect(hasNodeRegex).toBe(false)
    })

    it('should add custom client specifiers', () => {
      const result = preset({
        client: {
          specifiers: ['my-custom-server-lib'],
        },
      })

      expect(result.client.specifiers).toContain('my-custom-server-lib')
      expect(result.client.specifiers).toContain('fs') // defaults still present
    })

    it('should add custom client files', () => {
      const result = preset({
        client: {
          files: ['**/api/**'],
        },
      })

      expect(result.client.files).toContain('**/api/**')
      expect(result.client.files).toContain('**/*.server.*') // defaults still present
    })

    it('should add custom ignoreImporters', () => {
      const result = preset({
        ignoreImporters: ['**/e2e/**'],
      })

      expect(result.ignoreImporters).toContain('**/e2e/**')
      expect(result.ignoreImporters).toContain('**/*.test.*') // defaults still present
    })
  })
})
