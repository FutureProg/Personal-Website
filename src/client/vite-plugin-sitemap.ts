import type { Plugin, ResolvedConfig } from 'vite'
import fs from 'node:fs'
import path from 'node:path'

const BASE_URL = 'https://nickmorrison.me'

function findHtmlFiles(dir: string, base: string = dir): string[] {
  if (!fs.existsSync(dir)) return []
  const results: string[] = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...findHtmlFiles(fullPath, base))
    } else if (entry.name === 'index.html') {
      const rel = path.relative(base, path.dirname(fullPath))
      const urlPath = rel === '.' ? '/' : `/${rel.replace(/\\/g, '/')}/`
      results.push(urlPath)
    }
  }
  return results
}

export function sitemapPlugin(): Plugin {
  let resolvedConfig: ResolvedConfig
  return {
    name: 'sitemap',
    configResolved(config) {
      resolvedConfig = config
    },
    closeBundle() {
      // Only generate sitemap for the client build, not the SSR build
      const outDir = resolvedConfig.build.outDir
      if (!outDir.includes('client')) return

      const urlPaths = findHtmlFiles(outDir).sort()
      const urls = urlPaths.map(p => {
        const normalized = p === '/' ? '/' : p.replace(/\/$/, '')
        return `${BASE_URL}${normalized}`
      })
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url><loc>${url}</loc></url>`).join('\n')}
</urlset>`
      const sitemapPath = path.join(outDir, 'sitemap.xml')
      fs.writeFileSync(sitemapPath, xml)
    }
  }
}
