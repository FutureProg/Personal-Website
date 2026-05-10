import type { Meta, ReactRenderer, StoryContext, StoryObj } from '@storybook/react-vite';
import {mocked} from 'storybook/test';

import { GithubActivityView } from './GithubActivityView';
import { useGithubActivity } from '../hooks/useGithubActivity';
import React, { useState } from 'react';

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
    {
        repositoryName: 'FutureProg/repository-name-#3',
        repositoryUrl: 'https://github.com/FutureProg/repository-name-3',
        commitId: 'b8dsa8d3f1a2c4e5f6789012345678901234567',
        commitUrl: 'https://github.com/FutureProg/repository-name-3/commit/b8dsa8d3f1a2c4e5f6789012345678901234567',
        commitTimestamp: '2028-09-09T17:00:00-05:00',
    },
    {
        repositoryName: 'FutureProg/repository-name-#4',
        repositoryUrl: 'https://github.com/FutureProg/repository-name-4',
        commitId: 'b8dsa8d3f1a2c4e5f6789012345678901234567',
        commitUrl: 'https://github.com/FutureProg/repository-name-4/commit/b8dsa8d3f1a2c4e5f6789012345678901234567',
        commitTimestamp: '2028-09-09T17:00:00-05:00',
    },
    {
        repositoryName: 'FutureProg/repository-name-#5',
        repositoryUrl: 'https://github.com/FutureProg/repository-name-5',
        commitId: 'b8dsa8d3f1a2c4e5f6789012345678901234567',
        commitUrl: 'https://github.com/FutureProg/repository-name-5/commit/b8dsa8d3f1a2c4e5f6789012345678901234567',
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
            else if (name === 'Online') {
                mocked(useGithubActivity).mockImplementation(() => ({
                    items: sampleFeed.slice(0, 1),
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
    parameters: {
        layout: 'padded'
    },
    render: (args, context) => {
        return React.createElement(() => {
            const [activities, setActivities] = useState(sampleFeed.slice(0, 1));
            const addActivity = () => {                
                if (activities && activities.length >= sampleFeed.length) return;
                const newItem = sampleFeed[activities.length];
                document.startViewTransition?.(() => {
                    setActivities((prev) => [newItem!, ...prev]);
                });
            }
            const removeActivity = () => {
                document.startViewTransition?.(() => {
                    setActivities((prev) => prev.slice(0, prev.length - 1));
                });
            }
            mocked(useGithubActivity).mockImplementation(() => ({
                items: activities,
                connectionStatus: 'connected',
            }));

            return (<div style={{display: 'grid', gridTemplateRows: 'auto 1fr', justifyContent: 'center'}}>
                <div style={{display: 'flex', 'justifyContent': 'center'}}>
                    <button onClick={addActivity}>Add Activity</button>
                    <button onClick={removeActivity}>Remove Activity</button>
                </div>
                <GithubActivityView />
            </div>);
        });
    }
};

export const Offline: Story = {
};
