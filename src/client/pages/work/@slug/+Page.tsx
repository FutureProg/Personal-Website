import { useData } from 'vike-react/useData'
import { getWorkItem } from '../../../util/content'
import type { Data } from './+data'

export default function Page() {
  const item = useData<Data>()
  const ItemComponent = getWorkItem(item.slug)!.component
  return (
    <main>
      <section>
        <ItemComponent />
      </section>
    </main>
  )
}
