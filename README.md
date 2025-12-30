# unplugin-deny-imports

Deny imports with full import trace support. Works with Vite, Bun, Rollup, webpack, and esbuild.

## Features

- **Full Import Trace** - See the complete import chain, not just the immediate importer
- **Multi-Bundler Support** - Works with Vite, Bun, Rollup, webpack, and esbuild
- **Batteries-Included Presets** - 200+ server-only packages blocked out of the box
- **Directive Enforcement** - Automatically enforces `"use server"` / `"use client"` directives
- **Pattern Matching** - Glob patterns and RegExp support for flexible rules

## Why?

When a server-only import leaks into client code, you need to know **how** it got there:

```
🚫 Import Denied
🌐 client  ·  pattern: drizzle-orm
────────────────────────────────────────
  1. ❌ drizzle-orm
  2. src/lib/api.ts
  3. src/routes/index.tsx (entry)
────────────────────────────────────────
```

## Install

```bash
npm install unplugin-deny-imports
# or
bun add unplugin-deny-imports
```

## Quick Start

### Vite

```typescript
import denyImports from 'unplugin-deny-imports/vite'
import preset from 'unplugin-deny-imports/presets'

export default defineConfig({
  plugins: [
    denyImports(preset),
  ],
})
```

### Bun

```typescript
import denyImports from 'unplugin-deny-imports/bun'
import preset from 'unplugin-deny-imports/presets'

await Bun.build({
  entrypoints: ['./src/index.ts'],
  plugins: [denyImports({ ...preset, target: 'client' })],
})
```

## Custom Rules

```typescript
import denyImports from 'unplugin-deny-imports/vite'

export default defineConfig({
  plugins: [
    denyImports({
      client: {
        specifiers: [/@app\/.*\/server$/],
        files: ['**/*.server.ts'],
      },
      server: {
        specifiers: ['react-dom/client'],
      },
      ignoreImporters: [/\.test\.ts$/],
    }),
  ],
})
```

## Extend the Preset

```typescript
import denyImports from 'unplugin-deny-imports/vite'
import preset from 'unplugin-deny-imports/presets'

export default defineConfig({
  plugins: [
    denyImports({
      client: {
        specifiers: [...preset.client.specifiers, /@app\/.*\/server$/],
        files: preset.client.files,
      },
      server: preset.server,
      ignoreImporters: [...preset.ignoreImporters, /\.test\.ts$/],
    }),
  ],
})
```

## Default Preset

The preset blocks common server-only code from client and vice versa:

**Client denies:**

- Node.js built-ins (`fs`, `path`, `crypto`, `node:*`, etc.)
- Bun built-ins (`bun:*`)
- Databases & ORMs (`pg`, `drizzle-orm`, `prisma`, `mongodb`, `redis`, etc.)
- Server frameworks (`express`, `fastify`, `hono`, `koa`, etc.)
- Auth (`bcrypt`, `jsonwebtoken`, `lucia`, `passport`, etc.)
- Email (`nodemailer`, `resend`, `@sendgrid/*`, etc.)
- File & storage (`sharp`, `@aws-sdk/*`, `multer`, etc.)
- Queues (`bullmq`, `pg-boss`, etc.)
- Payments (`stripe`, etc.)
- Testing (`vitest`, `jest`, `playwright`, etc.)
- Server file conventions (`**/*.server.*`, `**/.server/**`)

**Server denies:**

- `react-dom/client`
- Client-only packages (`framer-motion`, `localforage`, etc.)
- Client file conventions (`**/*.client.*`, `**/.client/**`)

## Options

| Option              | Type                   | Default   | Description                                        |
| ------------------- | ---------------------- | --------- | -------------------------------------------------- |
| `client.specifiers` | `(string \| RegExp)[]` | -         | Deny these import specifiers in client             |
| `client.files`      | `(string \| RegExp)[]` | -         | Deny files matching patterns in client             |
| `server.specifiers` | `(string \| RegExp)[]` | -         | Deny these import specifiers in server             |
| `server.files`      | `(string \| RegExp)[]` | -         | Deny files matching patterns in server             |
| `ignoreImporters`   | `(string \| RegExp)[]` | -         | Skip if chain includes these files                 |
| `maxDepth`          | `number`               | `15`      | Max depth for import trace                         |
| `directives`        | `boolean`              | `true`    | Enforce `"use server"` / `"use client"`            |
| `target`            | `'client' \| 'server'` | -         | Build target for Bun/esbuild                       |
| `mode`              | `'error' \| 'warn'`    | `'error'` | Throw or log warnings                              |
| `stack`             | `boolean`              | `false`   | Show JS stack trace in errors                      |

## Directive Enforcement

Files with `"use server"` or `"use client"` directives are automatically enforced:

- `"use server"` → Denied in client bundles
- `"use client"` → Denied in server bundles

```typescript
// actions.ts
"use server"  // ← Blocked from client imports

export async function createUser() { ... }
```

Disable with:

```typescript
denyImports({ directives: false })
```

## Pattern Types

- **Strings**: Glob patterns via [micromatch](https://github.com/micromatch/micromatch)
- **RegExp**: Full regex support

## Bundler Support

| Feature           | Vite | Bun | Rollup | webpack | esbuild |
| ----------------- | :--: | :-: | :----: | :-----: | :-----: |
| Specifier denial  |  ✅  | ✅  |   ✅   |   ✅    |   ✅    |
| File path denial  |  ✅  | ✅  |   ⚠️   |   ⚠️    |   ⚠️    |
| Full import trace |  ✅  | ✅  |   ✅   |   ✅    |   ✅    |
| SSR detection     |  ✅  | ✅* |   ❌   |   ❌    |   ❌    |
| HMR cleanup       |  ✅  | -   |   -    |    -    |    -    |

⚠️ = Limited (requires absolute paths)
\* = Via `target` option

## Credits

Inspired by [vite-env-only](https://github.com/pcattori/vite-env-only) by Pedro Cattori.

Built with [unplugin](https://github.com/unjs/unplugin) by the UnJS team.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT
