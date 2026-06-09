import { useData } from 'vike-react/useData'
import type { Data } from './+data'

export default function Head() {
  const item = useData<Data>()
  return (
    <>
      <title>{item.title} — Nick Morrison</title>
      <meta name="description" content={item.description} />
      <meta property="og:title" content={item.title} />
      <meta property="og:description" content={item.description} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={`https://nickmorrison.me/work/${item.slug}`} />
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={item.title} />
      <meta name="twitter:description" content={item.description} />
      <link rel="canonical" href={`https://nickmorrison.me/work/${item.slug}`} />
    </>
  )
}
