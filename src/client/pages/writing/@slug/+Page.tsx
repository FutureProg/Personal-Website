import { useData } from 'vike-react/useData'
import type { Data } from './+data'

export default function Page() {
  const post = useData<Data>()
  const PostComponent = post.component
  return (
    <main>
      <section>
        <PostComponent />
      </section>
    </main>
  )
}
