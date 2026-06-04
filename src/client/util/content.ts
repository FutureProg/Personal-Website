import type { ComponentType } from 'react';
import type { WritingPost, WorkItem } from '../content/types';

type MDXModule = {
  default: ComponentType;
  frontmatter: Record<string, unknown>;
};

const writingModules = import.meta.glob<MDXModule>('../content/writing/*.mdx', { eager: true });
const workModules = import.meta.glob<MDXModule>('../content/work/*.mdx', { eager: true });

function slugFromPath(path: string): string {
  const filename = path.split('/').at(-1) ?? '';
  return filename.replace(/\.mdx$/, '');
}

export function getWritingPosts(): WritingPost[] {
  return Object.entries(writingModules)
    .map(([path, mod]) => ({
      slug: slugFromPath(path),
      component: mod.default,
      // frontmatter is Record<string,unknown> from MDX — fields must match WritingPost or they'll be undefined at runtime
      ...(mod.frontmatter as Omit<WritingPost, 'slug' | 'component'>),
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getWorkItems(): WorkItem[] {
  return Object.entries(workModules).map(([path, mod]) => ({
    slug: slugFromPath(path),
    component: mod.default,
    // frontmatter is Record<string,unknown> from MDX — fields must match WorkItem or they'll be undefined at runtime
    ...(mod.frontmatter as Omit<WorkItem, 'slug' | 'component'>),
  }));
}

export function getWritingPost(slug: string): WritingPost | undefined {
  return getWritingPosts().find(p => p.slug === slug);
}

export function getWorkItem(slug: string): WorkItem | undefined {
  return getWorkItems().find(p => p.slug === slug);
}
