import { useData } from 'vike-react/useData'
import type { Data } from './+data'

export default function Head() {
  const post = useData<Data>()
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.description,
    "datePublished": post.date,
    "author": { "@type": "Person", "name": "Nick Morrison", "url": "https://nickmorrison.me" },
    "url": `https://nickmorrison.me/writing/${post.slug}`
  }
  return (
    <>
      <title>{post.title} — Nick Morrison</title>
      <meta name="description" content={post.description} />
      <meta property="og:title" content={post.title} />
      <meta property="og:description" content={post.description} />
      <meta property="og:type" content="article" />
      <meta property="og:url" content={`https://nickmorrison.me/writing/${post.slug}`} />
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={post.title} />
      <meta name="twitter:description" content={post.description} />
      <link rel="canonical" href={`https://nickmorrison.me/writing/${post.slug}`} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
    </>
  )
}
