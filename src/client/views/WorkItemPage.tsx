import { useParams } from 'react-router-dom';
import { getWorkItem } from '../util/content';

export const WorkItemPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const item = slug !== undefined ? getWorkItem(slug) : undefined;

  if (item === undefined) return <main><section>Work item not found.</section></main>;

  const Content = item.component;
  return (
    <main>
      <section>
        <Content />
      </section>
    </main>
  );
};
