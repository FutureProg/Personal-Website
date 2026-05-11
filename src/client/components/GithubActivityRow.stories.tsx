import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';

import { GithubActivityRow } from './GithubActivityRow';

const meta = {
    title: 'Components/Github Activity Row',
    component: GithubActivityRow,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {
        commitTimestamp: { control: 'text' },
    },
} satisfies Meta<typeof GithubActivityRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        repositoryName: 'FutureProg/repository-name',
        repositoryUrl: 'https://github.com/FutureProg/repository-name',
        commitId: 'b8dsa8d3f1a2c4e5f6789012345678901234567',
        commitUrl: 'https://github.com/FutureProg/repository-name/commit/b8dsa8d3f1a2c4e5f6789012345678901234567',
        commitTimestamp: '2028-09-09T17:00:00-05:00',
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        // Commit SHA is truncated to 7 characters
        const commitLink = canvas.getByRole('link', { name: 'b8dsa8d' });
        expect(commitLink).toBeInTheDocument();

        // Both links open in a new tab with security attributes
        const repoLink = canvas.getByRole('link', { name: 'FutureProg/repository-name' });
        for (const link of [repoLink, commitLink]) {
            expect(link).toHaveAttribute('target', '_blank');
            expect(link).toHaveAttribute('rel', 'noopener noreferrer');
        }

        // <time> dateTime preserves the raw ISO string for accessibility
        const timeEl = canvasElement.querySelector('time');
        expect(timeEl).toHaveAttribute('dateTime', '2028-09-09T17:00:00-05:00');
    },
};

export const RecentCommit: Story = {
    args: {
        repositoryName: 'FutureProg/personal-website',
        repositoryUrl: 'https://github.com/FutureProg/personal-website',
        commitId: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
        commitUrl: 'https://github.com/FutureProg/personal-website/commit/a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
        commitTimestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
};
