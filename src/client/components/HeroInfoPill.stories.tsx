import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

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
    play: async ({ canvas }) => {
        const pill = canvas.getByText('Safe Streets Halton').closest('div');
        expect(pill?.tagName).toMatch(/div/i);
        expect(canvas.getByText('Safe Streets Halton')).toBeInTheDocument();
        expect(canvas.getByText('President')).toBeInTheDocument();
        expect(canvas.queryByText('→')).not.toBeInTheDocument();
    },
};

export const Expanded: Story = {
    args: {
        icon: '🚲',
        title: 'Safe Streets Halton',
        subtitle: 'President',
        expanded: true,
    },
    play: async ({ canvasElement }) => {
        const pill = canvasElement.querySelector('[class*="expanded"]');
        expect(pill).not.toBeNull();
    },
};

export const WithLink: Story = {
    args: {
        icon: '🚲',
        title: 'Safe Streets Halton',
        subtitle: 'President',
        href: 'https://safestreetshalton.ca',
    },
    play: async ({ canvas }) => {
        const link = canvas.getByRole('link', { name: /Safe Streets Halton/i });
        expect(link.tagName).toMatch(/a/i);
        expect(link).toHaveAttribute('href', 'https://safestreetshalton.ca');
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
        expect(canvas.getByText('→')).toBeInTheDocument();
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
    play: async ({ canvas }) => {
        const link = canvas.getByRole('link', { name: /Safe Streets Halton/i });
        expect(link.tagName).toMatch(/a/i);
        expect(link.className).toMatch(/expanded/);
        expect(link).toHaveAttribute('href', 'https://safestreetshalton.ca');
        expect(canvas.getByText('→')).toBeInTheDocument();
    },
};
