import { getWorkItems } from '../../../util/content'

export function onBeforePrerenderStart() {
  return getWorkItems().map(item => `/work/${item.slug}`)
}
