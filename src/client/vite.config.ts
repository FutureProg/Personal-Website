/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import vike from 'vike/plugin';
import mdx from '@mdx-js/rollup';
import remarkFrontmatter from 'remark-frontmatter';
import remarkMdxFrontmatter from 'remark-mdx-frontmatter';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { varlockVitePlugin } from '@varlock/vite-integration';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import { sitemapPlugin } from './vite-plugin-sitemap';
const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  plugins: [
    vike({ prerender: true }),
    varlockVitePlugin(),
    mdx({ remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter] }),
    react(),
    sitemapPlugin(),
  ],
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist/client',
    sourcemap: true
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'happy-dom',
          include: ['**/*.test.ts', '**/*.test.tsx'],
          globals: true,
        },
        resolve: {
          alias: {
            '@common': path.join(dirname, '../common'),
          },
        },
      },
      {
        extends: true,
        plugins: [
          storybookTest({
            configDir: path.join(dirname, '.storybook')
          })
        ],
        resolve: {
          alias: {
            '@common': path.join(dirname, '../common'),
          },
        },
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{
              browser: 'chromium'
            }]
          }
        }
      }
    ]
  }
});
