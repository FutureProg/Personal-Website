import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactElement } from 'react';
import { expect, within } from 'storybook/test';

import { NavBar } from './NavBar';

// NavBar's CSS subgrids into the page's `body` grid (see src/client/styles/index.css)
// to line up with the named `fullbleed`/`main`/`nav` grid lines. Storybook doesn't mount
// stories under that grid, so this decorator recreates it as the immediate parent.
const withPageGrid = (Story: () => ReactElement) => (
    <div
        style={{
            display: 'grid',
            gridTemplateColumns:
                '[fullbleed-start] minmax(var(--page-padding-inline), 1fr) [main-start] min(var(--max-width-content), 100% - 2 * var(--page-padding-inline)) [main-end] minmax(var(--page-padding-inline), 1fr) [fullbleed-end]',
            gridTemplateRows: '[nav] auto',
        }}
    >
        <Story />
    </div>
);

const meta = {
    title: 'Components/Nav Bar',
    component: NavBar,
    parameters: {
        layout: 'fullscreen',
    },
    decorators: [withPageGrid],
    tags: ['autodocs'],
} satisfies Meta<typeof NavBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Homepage: Story = {
    args: {
        pageLinks: [
            { label: 'About', href: '#about' },
            { label: 'Work', href: '#work' },
            { label: 'Writing', href: '#writing' },
        ],
        cta: { label: 'Get in touch', href: '#contact' },
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        for (const label of ['About', 'Work', 'Writing']) {
            expect(canvas.getByRole('link', { name: label })).toBeInTheDocument();
        }

        const cta = canvas.getByRole('link', { name: 'Get in touch' });
        expect(cta).toBeInTheDocument();

        for (const label of ['Github', 'LinkedIn']) {
            const social = canvas.getByRole('link', { name: label });
            expect(social).toHaveAttribute('target', '_blank');
            expect(social).toHaveAttribute('rel', 'noopener noreferrer');
        }
    },
};

export const PostPage: Story = {
    args: {
        pageLinks: [{ label: 'Home', href: '/' }],
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        expect(canvas.getByRole('link', { name: 'Home' })).toBeInTheDocument();
        expect(canvas.queryByRole('link', { name: 'Get in touch' })).not.toBeInTheDocument();
    },
};
