import { getWritingPosts } from '../../../util/content'

export function onBeforePrerenderStart() {
  return getWritingPosts().map(post => `/writing/${post.slug}`)
}
