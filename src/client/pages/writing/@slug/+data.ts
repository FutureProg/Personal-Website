import type { PageContextServer } from 'vike/types'
import { getWritingPost } from '../../../util/content'

export async function data(pageContext: PageContextServer) {
  const slug = pageContext.routeParams['slug']
  if (!slug) throw new Error('Writing post slug is missing')
  const post = getWritingPost(slug)
  if (!post) throw new Error(`Writing post not found: ${slug}`)
  return post
}

export type Data = Awaited<ReturnType<typeof data>>
