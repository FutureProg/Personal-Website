import type { ComponentType } from 'react';

export interface WritingPost {
  slug: string;
  title: string;
  date: string;
  description: string;
  component: ComponentType;
}

export interface WorkItem {
  slug: string;
  title: string;
  category: string;
  description: string;
  cardColor: string;
  icon: string;
  component: ComponentType;
}
