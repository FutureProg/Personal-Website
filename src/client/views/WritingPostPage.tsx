import { useParams } from 'react-router-dom';
import { getWritingPost } from '../util/content';

export const WritingPostPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const post = slug !== undefined ? getWritingPost(slug) : undefined;

  if (post === undefined) return <main><section>Post not found.</section></main>;

  const Content = post.component;
  return (
    <main>
      <section>
        <Content />
      </section>
    </main>
  );
};
