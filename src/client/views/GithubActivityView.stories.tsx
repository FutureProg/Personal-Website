import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, mocked, within } from 'storybook/test';

import { GithubActivityView } from './GithubActivityView';
import { useGithubActivity } from '../hooks/useGithubActivity';
import React, { useState } from 'react';

const sampleFeed = Array.from({length: 5}).map((_, index) => {
    const repoName = 'FutureProg/repository-name' + (index > 0 ? '-' + (index + 1) : '');
    const commitSha = crypto.randomUUID().replace(/-/g, '').slice(0, 40);
    return {
        repository: {
            name: repoName,
            url: 'https://github.com/FutureProg/' + repoName,
        },
        commit: {
            sha: commitSha,
            message: 'Sample commit message for ' + repoName,
            url: 'https://github.com/FutureProg/' + repoName + '/commit/' + commitSha,
        },
        timestamp: Temporal.Now.instant().add(Temporal.Duration.from({ hours: index * 5 })).toString(),
    }
});

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
                    error: undefined,
                }));
            }
            else if (name === 'Online') {
                mocked(useGithubActivity).mockImplementation(() => ({
                    items: sampleFeed.slice(0, 1),
                    connectionStatus: 'connected',
                    error: undefined,
                }));
            }
            else if (name === 'Error') {
                mocked(useGithubActivity).mockImplementation(() => ({
                    items: [],
                    connectionStatus: 'error',
                    error: 'Error occurred connecting to the Github API',
                }));
            }
            else if (name === 'Connection Failure') {
                mocked(useGithubActivity).mockImplementation(() => ({
                    items: [],
                    connectionStatus: 'error',
                    error: 'Error occurred connecting to the Activity Stream. \n Please check your internet connection',
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
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        expect(canvas.getByText('ONLINE')).toBeInTheDocument();
        expect(canvas.getByText('FutureProg/repository-name')).toBeInTheDocument();

    },
    render: (args, context) => {
        return React.createElement(() => {
            const [activities, setActivities] = useState(sampleFeed.slice(0, 1));
            const addActivity = () => {                                
                let newItem = sampleFeed[activities.length % sampleFeed.length]!;
                newItem = { ...newItem, 
                    repository: { ...newItem.repository, url: newItem.repository.url + '?t=' + Date.now() } }; // Ensure unique URL for view transition
                document.startViewTransition(() => {
                    setActivities((prev) => [newItem!, ...prev].slice(0, sampleFeed.length));
                });
            }
            const removeActivity = () => {
                document.startViewTransition(() => {
                    setActivities((prev) => prev.slice(0, prev.length - 1));
                });
            }
            mocked(useGithubActivity).mockImplementation((options) => {
                return {
                    items: activities,
                    connectionStatus: 'connected',
                    error: undefined,
                }
            });

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
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        expect(canvas.getByText('No recent activity')).toBeInTheDocument();
        expect(canvas.getByText('OFFLINE')).toBeInTheDocument();
    },
};

export const Error: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        expect(canvas.getByText('Error occurred connecting to the Github API')).toBeInTheDocument();
        expect(canvas.getByText('ERROR')).toBeInTheDocument();
    },
}

export const ConnectionFailure: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        expect(canvas.getByText('Error occurred connecting to the Activity Stream. Please check your internet connection')).toBeInTheDocument();
        expect(canvas.getByText('ERROR')).toBeInTheDocument();
    },
}