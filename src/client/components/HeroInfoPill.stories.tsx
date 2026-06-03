import type { Meta, StoryObj } from '@storybook/react-vite';

import { HeroInfoPill } from './HeroInfoPill';

const meta = {
    title: 'Components/Hero Info Pill',
    component: HeroInfoPill,
} satisfies Meta<typeof HeroInfoPill>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        icon: '🚲',
        title: 'Safe Streets Halton',
        subtitle: 'President',
    },
};

export const Expanded: Story = {
    args: {
        icon: '🚲',
        title: 'Safe Streets Halton',
        subtitle: 'President',
        expanded: true,
    },
};

export const WithLink: Story = {
    args: {
        icon: '🚲',
        title: 'Safe Streets Halton',
        subtitle: 'President',
        href: 'https://safestreetshalton.ca',
    },
};

export const WithLinkExpanded: Story = {
    args: {
        icon: '🚲',
        title: 'Safe Streets Halton',
        subtitle: 'President',
        href: 'https://safestreetshalton.ca',
        expanded: true,
    },
};
