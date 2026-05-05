import type { Meta, StoryObj } from '@storybook/react-vite';

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

// Interactive story to demonstrate ViewTransitions
import { useState } from 'react';

const sampleRepos = [
    {
        repositoryName: 'FutureProg/personal-website',
        repositoryUrl: 'https://github.com/FutureProg/personal-website',
        commitId: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
        commitUrl: 'https://github.com/FutureProg/personal-website/commit/a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
        commitTimestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
        repositoryName: 'FutureProg/repository-name',
        repositoryUrl: 'https://github.com/FutureProg/repository-name',
        commitId: 'b8dsa8d3f1a2c4e5f6789012345678901234567',
        commitUrl: 'https://github.com/FutureProg/repository-name/commit/b8dsa8d3f1a2c4e5f6789012345678901234567',
        commitTimestamp: '2028-09-09T17:00:00-05:00',
    },
    {
        repositoryName: 'FutureProg/another-project',
        repositoryUrl: 'https://github.com/FutureProg/another-project',
        commitId: 'c9e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9',
        commitUrl: 'https://github.com/FutureProg/another-project/commit/c9e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9',
        commitTimestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
    {
        repositoryName: 'FutureProg/cool-library',
        repositoryUrl: 'https://github.com/FutureProg/cool-library',
        commitId: 'd0f1e2d3c4b5a6978869504132edcbaf97685544',
        commitUrl: 'https://github.com/FutureProg/cool-library/commit/d0f1e2d3c4b5a6978869504132edcbaf97685544',
        commitTimestamp: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    },
];

const ViewTransitionDemo = () => {
    const [repos, setRepos] = useState(sampleRepos.slice(0, 2));
    const [nextIndex, setNextIndex] = useState(2);

    const addRepo = async () => {
        if (nextIndex >= sampleRepos.length) return;

        const newRepo = sampleRepos[nextIndex];
        if (!newRepo) return;

        const transition = (document as any).startViewTransition(() => {
            setRepos([newRepo, ...repos]);
            setNextIndex(nextIndex + 1);
        });

        await transition.finished;
    };

    const removeFirstRepo = async () => {
        if (repos.length === 0) return;

        const transition = (document as any).startViewTransition(() => {
            setRepos(repos.slice(1));
            if (nextIndex > 0) setNextIndex(nextIndex - 1);
        });

        await transition.finished;
    };

    return (
        <div style={{ width: '600px' }}>
            <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
                <button 
                    onClick={addRepo}
                    disabled={nextIndex >= sampleRepos.length}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: '#0969da',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: nextIndex >= sampleRepos.length ? 'not-allowed' : 'pointer',
                        opacity: nextIndex >= sampleRepos.length ? 0.5 : 1,
                    }}
                >
                    Add Repository
                </button>
                <button 
                    onClick={removeFirstRepo}
                    disabled={repos.length === 0}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: '#cf222e',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: repos.length === 0 ? 'not-allowed' : 'pointer',
                        opacity: repos.length === 0 ? 0.5 : 1,
                    }}
                >
                    Remove First
                </button>
            </div>
            <div style={{ border: '1px solid #d0d7de', borderRadius: '6px' }}>
                {repos.map((repo) => (
                    <GithubActivityRow
                        key={repo.commitId}
                        repositoryName={repo.repositoryName}
                        repositoryUrl={repo.repositoryUrl}
                        commitId={repo.commitId}
                        commitUrl={repo.commitUrl}
                        commitTimestamp={repo.commitTimestamp}
                    />
                ))}
            </div>
        </div>
    );
};

export const WithViewTransitions = {
    render: () => <ViewTransitionDemo />,
    parameters: {
        docs: {
            description: {
                story: 'Interactive demo showing ViewTransitions. Click "Add Repository" to add a new item at the top with fade-in + slide-down animation, or "Remove First" to remove the top item with a fade-out animation.',
            },
        },
    },
};
