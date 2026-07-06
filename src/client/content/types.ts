import type { ComponentType } from 'react';
import type { MDXComponents } from 'mdx/types';

export type MdxComponentType = ComponentType<{ components?: MDXComponents }>;

export interface WritingPost {
  slug: string;
  title: string;
  date: string; // "YYYY-MM" format — used for localeCompare sort, e.g. "2025-05"
  description: string;
  component: MdxComponentType;
}

export interface WorkItem {
  slug: string;
  title: string;
  category: string;
  description: string;
  cardColor: string;
  icon: string;
  component: MdxComponentType;
}
