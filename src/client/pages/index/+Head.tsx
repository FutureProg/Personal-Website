export default function Head() {
  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "Nick Morrison",
    "url": "https://nickmorrison.me",
    "jobTitle": "Full Stack Software Developer",
    "address": { "@type": "PostalAddress", "addressLocality": "Burlington", "addressRegion": "ON" },
    "sameAs": ["https://github.com/futureprog"]
  }

  return (
    <>
      <title>Nick Morrison — Full Stack Software Developer</title>
      <meta name="description" content="Full stack developer with a decade across the stack, based in Burlington, ON. I care as much about the user's experience as the code behind it." />
      <meta property="og:title" content="Nick Morrison" />
      <meta property="og:description" content="Full stack developer based in Burlington, ON." />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://nickmorrison.me/" />
      <meta property="og:image" content="https://nickmorrison.me/hero-photo.png" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Nick Morrison" />
      <meta name="twitter:description" content="Full stack developer based in Burlington, ON." />
      <meta name="twitter:image" content="https://nickmorrison.me/hero-photo.png" />
      <link rel="canonical" href="https://nickmorrison.me/" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }} />
    </>
  )
}
