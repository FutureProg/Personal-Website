import { Children, isValidElement, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { Mermaid } from './Mermaid';

function textContent(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textContent).join('');
  if (isValidElement(node)) return textContent((node.props as { children?: ReactNode }).children);
  return '';
}

/**
 * MDX renders fenced code blocks as `<pre><code className="language-xxx">`.
 * A `language-mermaid` block is a diagram, not code, so it's swapped for a live render.
 */
export function MdxPre(props: ComponentPropsWithoutRef<'pre'>) {
  const child = Children.only(props.children);
  if (isValidElement(child)) {
    const className = (child.props as { className?: string }).className;
    if (className?.split(' ').includes('language-mermaid')) {
      return <Mermaid chart={textContent(child)} />;
    }
  }
  return <pre {...props} />;
}
