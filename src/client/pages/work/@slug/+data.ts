import type { PageContextServer } from 'vike/types'
import { getWorkItem } from '../../../util/content'

export async function data(pageContext: PageContextServer) {
  const slug = pageContext.routeParams['slug']
  if (!slug) throw new Error('Work item slug is missing')
  const item = getWorkItem(slug)
  if (!item) throw new Error(`Work item not found: ${slug}`)
  return item
}

export type Data = Awaited<ReturnType<typeof data>>
