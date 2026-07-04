import { useData } from 'vike-react/useData'
import { getWritingPost } from '../../../util/content'
import { MdxPre } from '../../../components/MdxPre'
import type { Data } from './+data'

export default function Page() {
  const post = useData<Data>()
  const PostComponent = getWritingPost(post.slug)!.component
  return (
    <main>
      <section>
        <PostComponent components={{ pre: MdxPre }} />
      </section>
    </main>
  )
}
