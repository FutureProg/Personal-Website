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
        emoji: '🚲',
        title: 'Safe Streets Halton',
        subtitle: 'President',
    },
};

export const Large: Story = {
    args: {
        emoji: '🃏',
        title: 'Pokémon TCG',
        subtitle: 'Deck builder',
        size: 'lg',
    },
};
