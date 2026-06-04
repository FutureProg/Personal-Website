declare module '*.css';

declare module '*.mdx' {
  import type { ComponentType } from 'react';
  const Component: ComponentType;
  export const frontmatter: Record<string, unknown>;
  export default Component;
}
