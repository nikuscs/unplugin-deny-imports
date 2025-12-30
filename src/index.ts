import fs from 'node:fs'
import path from 'node:path'
import { createUnplugin, type UnpluginFactory, type UnpluginOptions } from 'unplugin'
import type { ResolvedConfig, ConfigEnv } from 'vite'
import micromatch from 'micromatch'

// ============================================================================
// Types
// ============================================================================

export type Env = 'client' | 'server'
export type Pattern = string | RegExp

export interface EnvOptions {
  /** Deny by import specifier (e.g., `@app/*\/server`, `node:*`) */
  specifiers?: Pattern[]
  /** Deny by resolved file path (e.g., `**\/*.server.ts`) */
  files?: Pattern[]
}

export interface Options {
  /** Rules when importing in client context (ssr=false) */
  client?: EnvOptions
  /** Rules when importing in server context (ssr=true) */
  server?: EnvOptions
  /** Skip checks if any file in the import chain matches these patterns */
  ignoreImporters?: Pattern[]
  /** Max depth for import trace (default: 15) */
  maxDepth?: number
  /** Enforce "use server"/"use client" directives (default: true) */
  directives?: boolean
  /** Build target for bundlers without SSR detection (Bun, esbuild). Vite ignores this. */
  target?: Env
  /** 'error' throws on denied imports (default), 'warn' logs warning and continues */
  mode?: 'error' | 'warn'
  /** Show JS stack trace in errors (default: false) */
  stack?: boolean
}

type EnvPatterns = Partial<Record<Env, Pattern[] | undefined>>

// ============================================================================
// Import Graph (scoped per plugin instance)
// ============================================================================

interface ImportEdge {
  importer: string
  specifier: string
}

type TraceEntry = { file: string; specifier?: string }
type Trace = TraceEntry[]

function createGraph() {
  const graph = new Map<string, ImportEdge[]>()

  return {
    record(id: string, importer: string, specifier: string): void {
      if (!graph.has(id)) graph.set(id, [])
      const edges = graph.get(id)!
      if (!edges.some((e) => e.importer === importer)) {
        edges.push({ importer, specifier })
      }
    },

    buildTrace(target: string, maxDepth = 20): Trace {
      const trace: Trace = [{ file: target }]
      const visited = new Set<string>()
      let current = target

      while (current && !visited.has(current) && trace.length < maxDepth) {
        visited.add(current)
        const edges = graph.get(current)
        if (!edges?.length) break

        const edge = edges[0]
        if (edge) {
          trace.unshift({ file: edge.importer, specifier: edge.specifier })
          current = edge.importer
        } else {
          break
        }
      }
      return trace
    },

    clear(): void {
      graph.clear()
    },

    /** Remove a file and its relationships (for HMR) */
    invalidate(file: string): void {
      graph.delete(file)
      // Also remove as importer from other entries
      for (const [id, edges] of graph.entries()) {
        graph.set(id, edges.filter((e) => e.importer !== file))
      }
    },

    get size(): number {
      return graph.size
    },
  }
}

// ============================================================================
// Pattern Matching
// ============================================================================

function match(id: string, patterns: Pattern[] | undefined): Pattern | null {
  if (!patterns) return null
  return patterns.find((p) =>
    typeof p === 'string' ? micromatch.isMatch(id, p) : p.test(id)
  ) ?? null
}

function isIgnored(trace: Trace, patterns: Pattern[]): boolean {
  return patterns.length > 0 && trace.some((entry) => match(entry.file, patterns))
}

// ============================================================================
// Path Utilities
// ============================================================================

function toRelative(root: string, filePath: string): string {
  return path.relative(root, filePath).split(path.sep).join('/')
}

// ============================================================================
// Error Formatting
// ============================================================================

const ENV_EMOJI: Record<Env, string> = {
  client: '🌐',
  server: '🖥️',
}

const SEPARATOR = '─'.repeat(40)
const PLUGIN_NAME = 'unplugin-deny-imports'

function getDirective(code: string): 'use server' | 'use client' | null {
  const t = code.trimStart()
  if (t.startsWith("'use server'") || t.startsWith('"use server"')) return 'use server'
  if (t.startsWith("'use client'") || t.startsWith('"use client"')) return 'use client'
  return null
}

interface ErrorInfo {
  message: string
  id?: string
  plugin: string
}

/** Find line number where a specifier is imported in a file */
function findImportLine(filePath: string, specifier: string): number | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    const lines = content.split('\n')
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? ''
      // Match import/require statements containing the specifier
      if (
        (line.includes('import') || line.includes('require')) &&
        (line.includes(`'${specifier}'`) || line.includes(`"${specifier}"`))
      ) {
        return i + 1
      }
    }
  } catch {
    // File might not exist or be readable
  }
  return null
}

function renderTrace(trace: Trace, denied: string, root: string): string {
  const reversed = [...trace].reverse()
  const lines = [
    `  1. ❌ ${denied}`,
    ...reversed.map((entry, i) => {
      const relative = toRelative(root, entry.file)
      const suffix = i === reversed.length - 1 ? ' (entry)' : ''
      // Find line number if we have a specifier to search for
      const lineNum = entry.specifier ? findImportLine(entry.file, entry.specifier) : null
      const loc = lineNum ? `:${lineNum}` : ''
      return `  ${i + 2}. ${relative}${loc}${suffix}`
    }),
  ]
  return lines.join('\n')
}

function denyError(
  type: 'specifier' | 'file',
  pattern: Pattern,
  trace: Trace,
  importId: string,
  resolvedPath: string | null,
  env: Env,
  root: string
): ErrorInfo {
  const formattedTrace = renderTrace(trace, importId, root)

  const lines = [
    `🚫 Import Denied`,
    `${ENV_EMOJI[env]} ${env}  ·  pattern: ${pattern}`,
    type === 'file' && resolvedPath ? `resolved: ${toRelative(root, resolvedPath)}` : null,
    SEPARATOR,
    formattedTrace,
    SEPARATOR,
  ].filter(Boolean)

  return {
    message: lines.join('\n'),
    id: trace[trace.length - 1]?.file ?? resolvedPath ?? undefined,
    plugin: PLUGIN_NAME,
  }
}

function directiveError(
  directive: 'use server' | 'use client',
  filePath: string,
  trace: Trace,
  env: Env,
  root: string
): ErrorInfo {
  const relativePath = toRelative(root, filePath)
  const formattedTrace = renderTrace(trace, relativePath, root)

  const lines = [
    `🚫 Directive Denied`,
    `${ENV_EMOJI[env]} ${env}  ·  "${directive}"`,
    `file: ${relativePath}`,
    SEPARATOR,
    formattedTrace,
    SEPARATOR,
  ]

  return {
    message: lines.join('\n'),
    id: filePath,
    plugin: PLUGIN_NAME,
  }
}

function fail(info: ErrorInfo, showStack = false): never {
  const err = new Error(info.message) as Error & { plugin?: string; id?: string }
  err.plugin = info.plugin
  if (info.id) err.id = info.id
  if (!showStack) err.stack = ''
  throw err
}

function warn(info: ErrorInfo): void {
  console.warn(`\n⚠️  [${info.plugin}]\n${info.message}\n`)
}

// ============================================================================
// Plugin Factory
// ============================================================================

export const unpluginFactory: UnpluginFactory<Options | undefined> = (options = {}) => {
  const specifiers: EnvPatterns = {
    client: options.client?.specifiers,
    server: options.server?.specifiers,
  }
  const files: EnvPatterns = {
    client: options.client?.files,
    server: options.server?.files,
  }
  const ignoreImporters = options.ignoreImporters ?? []
  const maxDepth = options.maxDepth ?? 15
  const enforceDirectives = options.directives ?? true
  const explicitTarget = options.target
  const mode = options.mode ?? 'error'
  const showStack = options.stack ?? false

  /** Handle denied import - throws in error mode, warns in warn mode */
  const deny = (info: ErrorInfo): void => {
    if (mode === 'warn') {
      warn(info)
    } else {
      fail(info, showStack)
    }
  }

  // Scoped state per plugin instance
  let root = process.cwd()
  let isSsrBuild = explicitTarget === 'server'
  const graph = createGraph()
  const resolving = new Set<string>()

  const specifiersPlugin: UnpluginOptions = {
    name: `${PLUGIN_NAME}/specifiers`,
    enforce: 'pre',

    vite: {
      configResolved(config: ResolvedConfig) {
        root = config.root
      },
      config(_config: unknown, env: ConfigEnv) {
        if (!explicitTarget) isSsrBuild = env.isSsrBuild ?? false
      },
      // Use Vite's per-request SSR detection
      resolveId(id: string, importer: string | undefined, opts: { ssr?: boolean }) {
        if (!importer) return null

        const env: Env = opts?.ssr ? 'server' : 'client'
        const patterns = specifiers[env]
        const denied = match(id, patterns)

        if (denied) {
          const trace = graph.buildTrace(importer, maxDepth)
          if (isIgnored(trace, ignoreImporters)) return null
          deny(denyError('specifier', denied, trace, id, null, env, root))
        }
        return null
      },
    },

    buildStart() {
      graph.clear()
      resolving.clear()
    },

    // Fallback for non-Vite bundlers
    resolveId(id, importer) {
      if (!importer) return null

      const env: Env = isSsrBuild ? 'server' : 'client'
      const patterns = specifiers[env]
      const denied = match(id, patterns)

      if (denied) {
        const trace = graph.buildTrace(importer, maxDepth)
        if (isIgnored(trace, ignoreImporters)) return null
        deny(denyError('specifier', denied, trace, id, null, env, root))
      }
      return null
    },
  }

  const filesPlugin: UnpluginOptions = {
    name: `${PLUGIN_NAME}/files`,
    enforce: 'pre',

    vite: {
      configResolved(config: ResolvedConfig) {
        root = config.root
      },
      config(_config: unknown, env: ConfigEnv) {
        if (!explicitTarget) isSsrBuild = env.isSsrBuild ?? false
      },
      // Invalidate changed files from import graph (HMR support)
      handleHotUpdate({ file }: { file: string }) {
        graph.invalidate(file)
      },
      async resolveId(id: string, importer: string | undefined, opts: { ssr?: boolean }) {
        if (importer?.endsWith('.html')) return null

        const resolveKey = `${id}:${importer}`
        if (resolving.has(resolveKey)) return null
        resolving.add(resolveKey)

        try {
          const resolved = await this.resolve(id, importer, { skipSelf: true })
          const resolvedId = resolved?.id
          if (!resolvedId || !path.isAbsolute(resolvedId)) return null

          if (importer) {
            graph.record(resolvedId, importer, id)
          }

          const relativePath = toRelative(root, resolvedId)
          const env: Env = opts?.ssr ? 'server' : 'client'
          const patterns = files[env]
          const denied = match(relativePath, patterns)

          if (denied) {
            const trace = importer ? graph.buildTrace(importer, maxDepth) : []
            if (isIgnored(trace, ignoreImporters)) return null
            deny(denyError('file', denied, trace, id, resolvedId, env, root))
          }
          return null
        } finally {
          resolving.delete(resolveKey)
        }
      },
    },

    // Fallback for non-Vite bundlers
    async resolveId(id, importer) {
      if (!importer || importer.endsWith('.html')) return null

      const resolveKey = `${id}:${importer}`
      if (resolving.has(resolveKey)) return null
      resolving.add(resolveKey)

      try {
        if (path.isAbsolute(id)) {
          graph.record(id, importer, id)
        }

        const env: Env = isSsrBuild ? 'server' : 'client'
        const patterns = files[env]

        if (path.isAbsolute(id)) {
          const relativePath = toRelative(root, id)
          const denied = match(relativePath, patterns)

          if (denied) {
            const trace = graph.buildTrace(importer, maxDepth)
            if (isIgnored(trace, ignoreImporters)) return null
            deny(denyError('file', denied, trace, id, id, env, root))
          }
        }
        return null
      } finally {
        resolving.delete(resolveKey)
      }
    },
  }

  const directivePlugin: UnpluginOptions = {
    name: `${PLUGIN_NAME}/directive`,
    enforce: 'pre',

    vite: {
      configResolved(config: ResolvedConfig) {
        root = config.root
      },
      transform(code: string, id: string, options?: { ssr?: boolean }) {
        if (!enforceDirectives) return null
        const directive = getDirective(code)
        if (!directive) return null

        const isServer = options?.ssr ?? false
        // Only deny "use server" in client bundles
        // "use client" is valid in SSR - it marks the boundary, not "never run on server"
        const invalid = directive === 'use server' && !isServer

        if (invalid) {
          const env: Env = isServer ? 'server' : 'client'
          deny(directiveError(directive, id, graph.buildTrace(id, maxDepth), env, root))
        }
        return null
      },
    },

    // Non-Vite fallback
    transform(code, id) {
      if (!enforceDirectives) return null
      const directive = getDirective(code)
      if (!directive) return null

      // Only deny "use server" in client bundles
      const invalid = directive === 'use server' && !isSsrBuild

      if (invalid) {
        deny(directiveError(directive, id, graph.buildTrace(id, maxDepth), 'client', root))
      }
      return null
    },
  }

  return [specifiersPlugin, filesPlugin, directivePlugin]
}

// ============================================================================
// Exports
// ============================================================================

export const unplugin = /* #__PURE__ */ createUnplugin(unpluginFactory)
export default unplugin

export const vitePlugin = unplugin.vite
export const rollupPlugin = unplugin.rollup
export const webpackPlugin = unplugin.webpack
export const esbuildPlugin = unplugin.esbuild
