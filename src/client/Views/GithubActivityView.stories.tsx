import type { Meta, ReactRenderer, StoryContext, StoryObj } from '@storybook/react-vite';
import {mocked} from 'storybook/test';

import { GithubActivityView } from './GithubActivityView';
import { useGithubActivity } from '../hooks/useGithubActivity';

const sampleRepositories = [
    {
        repositoryName: 'FutureProg/repository-name',
        repositoryUrl: 'https://github.com/FutureProg/repository-name',
        commitId: 'x8dsa8d3f1a2c4e5f6789012345678901234567',
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

const sampleFeed = sampleRepositories.map(repo => ({
    repository: {
        name: repo.repositoryName,
        url: repo.repositoryUrl,
    },
    commit: {
        sha: repo.commitId,
        message: 'Sample commit message for ' + repo.repositoryName,
        url: repo.commitUrl,
    },
    timestamp: repo.commitTimestamp,
}));

const meta = {
    title: 'Views/Github Activity View',
    component: GithubActivityView,
    decorators: [
        (Story, context) => {
            const name = context.name;
            if (name === 'Offline') {
                mocked(useGithubActivity).mockImplementation(() => ({
                    items: [],
                    connectionStatus: 'closed',
                }));
            }
            else if (name === 'Online' || name === 'FullFeed') {
                mocked(useGithubActivity).mockImplementation(() => ({
                    items: sampleFeed,
                    connectionStatus: 'connected',
                }));
            }

            return (<><Story /></>);
        },
    ],
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],    
} satisfies Meta<typeof GithubActivityView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Online: Story = {
};

export const Offline: Story = {
};
