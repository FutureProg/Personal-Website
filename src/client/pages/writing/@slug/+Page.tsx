import { useData } from 'vike-react/useData'
import { getWritingPost } from '../../../util/content'
import type { Data } from './+data'

export default function Page() {
  const post = useData<Data>()
  const PostComponent = getWritingPost(post.slug)!.component
  return (
    <main>
      <section>
        <PostComponent />
      </section>
    </main>
  )
}
