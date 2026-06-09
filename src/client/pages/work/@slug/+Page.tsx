import { useData } from 'vike-react/useData'
import type { Data } from './+data'

export default function Page() {
  const item = useData<Data>()
  const ItemComponent = item.component
  return (
    <main>
      <section>
        <ItemComponent />
      </section>
    </main>
  )
}
