import type { Pattern } from './index'

/** Preset with required fields for easy spreading */
export interface Preset {
  client: {
    specifiers: Pattern[]
    files: Pattern[]
  }
  server: {
    specifiers: Pattern[]
    files: Pattern[]
  }
  ignoreImporters: Pattern[]
}

/**
 * Default preset covering common server/client boundaries.
 *
 * Client denies: Node/Bun built-ins, databases, server frameworks, etc.
 * Server denies: Client-only packages and .client files
 */
export const defaultPreset: Preset = {
  client: {
    specifiers: [
      // ========================================
      // Node.js built-ins
      // ========================================
      /^node:/,
      'assert',
      'async_hooks',
      'buffer',
      'child_process',
      'cluster',
      'console',
      'constants',
      'crypto',
      'dgram',
      'diagnostics_channel',
      'dns',
      'domain',
      'events',
      'fs',
      'http',
      'http2',
      'https',
      'inspector',
      'module',
      'net',
      'os',
      'path',
      'perf_hooks',
      'process',
      'punycode',
      'querystring',
      'readline',
      'repl',
      'stream',
      'string_decoder',
      'timers',
      'tls',
      'trace_events',
      'tty',
      'url',
      'util',
      'v8',
      'vm',
      'wasi',
      'worker_threads',
      'zlib',

      // ========================================
      // Bun built-ins
      // ========================================
      /^bun:/,
      /^bun$/,

      // ========================================
      // Databases & ORMs
      // ========================================
      // PostgreSQL
      'pg',
      'postgres',
      '@vercel/postgres',
      '@neondatabase/serverless',

      // MySQL
      'mysql',
      'mysql2',

      // SQLite
      'better-sqlite3',
      'sql.js',
      'sqlite3',
      '@libsql/client',

      // MongoDB
      'mongodb',
      'mongoose',

      // Redis
      'redis',
      'ioredis',
      '@upstash/redis',

      // ORMs & Query Builders
      'drizzle-orm',
      /^drizzle-orm\//,
      'kysely',
      '@prisma/client',
      'prisma',
      'typeorm',
      'sequelize',
      'knex',
      '@mikro-orm/core',
      /^@mikro-orm\//,
      'objection',

      // Other databases
      /^@planetscale\//,
      /^@turso\//,
      '@clickhouse/client',
      'cassandra-driver',
      'neo4j-driver',
      'elasticsearch',
      '@elastic/elasticsearch',

      // ========================================
      // Server Frameworks
      // ========================================
      'express',
      /^express\//,
      'fastify',
      /^@fastify\//,
      'hono',
      /^hono\//,
      'koa',
      /^@koa\//,
      '@hapi/hapi',
      /^@hapi\//,
      'polka',
      'restify',

      // ========================================
      // Auth & Security
      // ========================================
      'bcrypt',
      'bcryptjs',
      'argon2',
      'jsonwebtoken',
      'jose',
      'passport',
      /^passport-/,
      'lucia',
      '@lucia-auth/adapter-drizzle',
      /^@lucia-auth\//,
      'arctic',
      '@auth/core',
      /^@auth\//,
      'next-auth',
      '@clerk/backend',

      // ========================================
      // Email
      // ========================================
      'nodemailer',
      '@sendgrid/mail',
      /^@sendgrid\//,
      'resend',
      'postmark',
      '@react-email/components',
      /^@react-email\//,
      'mailgun.js',
      '@mailchimp/mailchimp_marketing',

      // ========================================
      // File & Storage
      // ========================================
      'fs-extra',
      'chokidar',
      'glob',
      'fast-glob',
      'globby',
      'formidable',
      'multer',
      'busboy',
      'sharp',
      'jimp',
      '@aws-sdk/client-s3',
      /^@aws-sdk\//,
      '@google-cloud/storage',
      /^@google-cloud\//,
      /^@azure\//,
      'minio',

      // ========================================
      // Logging & Monitoring
      // ========================================
      'pino',
      /^pino-/,
      'winston',
      'bunyan',
      'morgan',
      'debug',
      '@sentry/node',
      'newrelic',
      'dd-trace',

      // ========================================
      // Queue & Background Jobs
      // ========================================
      'bullmq',
      'bull',
      'bee-queue',
      'agenda',
      '@quirrel/quirrel',
      'pg-boss',
      'graphile-worker',

      // ========================================
      // Realtime & WebSockets (server-side)
      // ========================================
      'socket.io',
      'ws',
      'pusher',
      '@pusher/push-notifications-server',
      'ably',

      // ========================================
      // Process & Environment
      // ========================================
      'dotenv',
      'dotenv/config',
      'cross-env',
      'execa',
      'shelljs',

      // ========================================
      // HTTP Clients (Node.js only)
      // ========================================
      'got',
      'node-fetch',
      'undici',

      // ========================================
      // Caching
      // ========================================
      'keyv',
      '@keyv/redis',
      /^@keyv\//,
      'node-cache',
      'lru-cache',

      // ========================================
      // Payments
      // ========================================
      'stripe',
      '@stripe/stripe-js', // This is client, but stripe is server
      '@lemonsqueezy/lemonsqueezy.js',
      'paddle-sdk',

      // ========================================
      // CMS & Content
      // ========================================
      '@sanity/client',
      'contentful',
      '@contentful/rich-text-types',
      'directus',
      '@directus/sdk',

      // ========================================
      // Testing (shouldn't be in prod bundles)
      // ========================================
      'vitest',
      /^@vitest\//,
      'jest',
      /^@jest\//,
      'mocha',
      'chai',
      'sinon',
      '@testing-library/react',
      /^@testing-library\//,
      'playwright',
      '@playwright/test',
      'puppeteer',
      'cypress',

      // ========================================
      // SSH & Network
      // ========================================
      'ssh2',
      'node-ssh',
      'ssh2-sftp-client',
      'basic-ftp',
      'ftp',

      // ========================================
      // System & Process
      // ========================================
      'systeminformation',
      'os-utils',
      'pidusage',
      'ps-list',

      // ========================================
      // Scheduling & Cron
      // ========================================
      'node-cron',
      'cron',
      'croner',
      'node-schedule',

      // ========================================
      // Compression & Archives
      // ========================================
      'archiver',
      'yauzl',
      'yazl',
      'tar',
      'tar-fs',
      'adm-zip',

      // ========================================
      // Scraping & DOM (Node.js)
      // ========================================
      'cheerio',
      'jsdom',
      'linkedom',
      'node-html-parser',

      // ========================================
      // PDF Generation (Node.js)
      // ========================================
      'pdfkit',
      '@react-pdf/renderer',

      // ========================================
      // GraphQL Server
      // ========================================
      '@apollo/server',
      /^@apollo\/server/,
      'graphql-yoga',
      'mercurius',
      '@graphql-tools/schema',

      // ========================================
      // gRPC & Messaging
      // ========================================
      '@grpc/grpc-js',
      '@grpc/proto-loader',
      'amqplib',
      'kafkajs',
      '@confluentinc/kafka-javascript',

      // ========================================
      // Communication APIs
      // ========================================
      'twilio',
      '@slack/web-api',
      /^@slack\//,
      'discord.js',
      'telegraf',

      // ========================================
      // AI/ML SDKs (server-side, has API keys)
      // ========================================
      'openai',
      '@anthropic-ai/sdk',
      'cohere-ai',
      '@google/generative-ai',
      'replicate',
      'langchain',
      /^@langchain\//,

      // ========================================
      // Templating (server-side rendering)
      // ========================================
      'ejs',
      'pug',
      'nunjucks',
      'eta',
    ],
    files: [
      '**/.server/**',
      '**/*.server.*',
      '**/*-server.*',
      '**/*_server.*',
    ],
  },
  server: {
    specifiers: [
      // React DOM client
      'react-dom/client',

      // Client-only routing
      '@tanstack/react-router',
      '@tanstack/router-devtools',

      // Animation (browser-only)
      'framer-motion',
      '@formkit/auto-animate',

      // Browser APIs
      'localforage',
      'idb',
      'idb-keyval',
    ],
    files: [
      '**/.client/**',
      '**/*.client.*',
      '**/*-client.*',
      '**/*_client.*',
    ],
  },
  ignoreImporters: [
    // TanStack Router generated route tree
    '**/routeTree.gen.ts',
    // Generic tree generation files
    '**/*.tree.ts',
    '**/tree.ts',
  ],
}

export default defaultPreset
