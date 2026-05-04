import type { Meta, StoryObj } from '@storybook/react-vite';

import { GithubActivityView } from './GithubActivityView';

const meta = {
    title: 'Components/GithubActivityView',
    component: GithubActivityView,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
} satisfies Meta<typeof GithubActivityView>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleRepositories = [
    {
        repositoryName: 'FutureProg/repository-name',
        repositoryUrl: 'https://github.com/FutureProg/repository-name',
        commitId: 'b8dsa8d3f1a2c4e5f6789012345678901234567',
        commitUrl: 'https://github.com/FutureProg/repository-name/commit/b8dsa8d3f1a2c4e5f6789012345678901234567',
        commitTimestamp: '2028-09-09T17:00:00-05:00',
    },
    {
        repositoryName: 'FutureProg/repository-name-#2',
        repositoryUrl: 'https://github.com/FutureProg/repository-name-2',
        commitId: 'b8dsa8d3f1a2c4e5f6789012345678901234567',
        commitUrl: 'https://github.com/FutureProg/repository-name-2/commit/b8dsa8d3f1a2c4e5f6789012345678901234567',
        commitTimestamp: '2028-09-09T17:00:00-05:00',
    },
];

export const Online: Story = {
    args: {
        status: 'live',
        repositories: sampleRepositories,
    },
};

export const Offline: Story = {
    args: {
        status: 'offline',
        repositories: sampleRepositories,
    },
};

export const FullFeed: Story = {
    args: {
        status: 'live',
        repositories: [
            ...sampleRepositories,
            {
                repositoryName: 'FutureProg/personal-website',
                repositoryUrl: 'https://github.com/FutureProg/personal-website',
                commitId: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
                commitUrl: 'https://github.com/FutureProg/personal-website/commit/a1b2c3d',
                commitTimestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            },
            {
                repositoryName: 'FutureProg/safe-streets-halton',
                repositoryUrl: 'https://github.com/FutureProg/safe-streets-halton',
                commitId: 'deadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
                commitUrl: 'https://github.com/FutureProg/safe-streets-halton/commit/deadbee',
                commitTimestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            },
            {
                repositoryName: 'FutureProg/ml-experiments',
                repositoryUrl: 'https://github.com/FutureProg/ml-experiments',
                commitId: 'cafebabecafebabecafebabecafebabecafebabe',
                commitUrl: 'https://github.com/FutureProg/ml-experiments/commit/cafebab',
                commitTimestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            },
        ],
    },
};
