import React from 'react';
import { StatusToken } from 'client';
import { GithubActivityRow } from 'client';

const MOCK_REPOS = [
  {
    name: 'FutureProg/personal-website',
    url: 'https://github.com/FutureProg/personal-website',
    sha: '4c64777',
    commitUrl: 'https://github.com/FutureProg/personal-website/commit/4c64777',
    ts: '2026-06-20T14:30:00Z',
  },
  {
    name: 'FutureProg/safe-streets-halton-web',
    url: 'https://github.com/FutureProg/safe-streets-halton-web',
    sha: 'a7f3d92',
    commitUrl: 'https://github.com/FutureProg/safe-streets-halton-web/commit/a7f3d92',
    ts: '2026-06-18T09:15:00Z',
  },
  {
    name: 'FutureProg/discord-activity-bot',
    url: 'https://github.com/FutureProg/discord-activity-bot',
    sha: 'b2c8e41',
    commitUrl: 'https://github.com/FutureProg/discord-activity-bot/commit/b2c8e41',
    ts: '2026-06-15T20:45:00Z',
  },
  {
    name: 'FutureProg/recipe-tracker',
    url: 'https://github.com/FutureProg/recipe-tracker',
    sha: 'f9d1a63',
    commitUrl: 'https://github.com/FutureProg/recipe-tracker/commit/f9d1a63',
    ts: '2026-06-10T11:00:00Z',
  },
  {
    name: 'FutureProg/advent-of-code',
    url: 'https://github.com/FutureProg/advent-of-code',
    sha: '3e5b784',
    commitUrl: 'https://github.com/FutureProg/advent-of-code/commit/3e5b784',
    ts: '2026-06-05T16:20:00Z',
  },
];

const glassCard: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  padding: 'var(--padding-lg)',
  gap: 'var(--gap-xl)',
  maxWidth: 640,
  width: '100%',
  borderRadius: 'var(--radius-card)',
  background: 'var(--glass-bg-strong)',
  backdropFilter: 'var(--glass-blur)',
  WebkitBackdropFilter: 'var(--glass-blur)',
  border: '1px solid var(--glass-border)',
  boxShadow: 'var(--glass-inset-top), var(--glass-inset-bottom), var(--glass-shadow)',
};

const statusMessage: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  fontFamily: 'var(--font-family-primary)',
  fontSize: 'var(--font-size-base)',
  fontWeight: 'var(--font-weight-light)' as React.CSSProperties['fontWeight'],
  textAlign: 'center',
  whiteSpace: 'pre-wrap',
  borderRadius: 16,
  padding: 8,
  background: 'var(--glass-bg)',
  backdropFilter: 'var(--glass-blur)',
  WebkitBackdropFilter: 'var(--glass-blur)',
  border: '1px solid var(--glass-border)',
  boxShadow: 'var(--glass-inset-top), var(--glass-inset-bottom), var(--glass-shadow)',
};

function Header({ status }: { status: 'online' | 'offline' | 'error' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-xs)', width: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--gap-xl)' }}>
        <h2 style={{ fontWeight: 'var(--font-weight-semibold)' as React.CSSProperties['fontWeight'], fontSize: 'clamp(1.5rem, 6vw, 2rem)', lineHeight: 'normal', color: 'var(--text-primary)', margin: 0 }}>
          GitHub Activity
        </h2>
        <StatusToken status={status} />
      </div>
      <p style={{ fontWeight: 'var(--text-subtitle-weight)' as React.CSSProperties['fontWeight'], fontSize: 'var(--text-subtitle-size)', lineHeight: 'var(--text-subtitle-line-height)', color: 'var(--text-subtitle)', margin: 0 }}>
        5 Most Recent GitHub Repositories with commits
      </p>
    </div>
  );
}

function OnlineCard() {
  return (
    <div style={glassCard}>
      <Header status="online" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
        {MOCK_REPOS.map((r) => (
          <GithubActivityRow
            key={r.name}
            repositoryName={r.name}
            repositoryUrl={r.url}
            commitId={r.sha}
            commitUrl={r.commitUrl}
            commitTimestamp={r.ts}
          />
        ))}
      </div>
    </div>
  );
}

function OfflineCard() {
  return (
    <div style={glassCard}>
      <Header status="offline" />
      <div style={statusMessage}>No recent activity</div>
    </div>
  );
}

function ErrorCard() {
  return (
    <div style={glassCard}>
      <Header status="error" />
      <div style={statusMessage}>
        {'An error occurred connecting to the Activity Stream.\nPlease check your internet connection.'}
      </div>
    </div>
  );
}

export function GithubActivityViewPreview() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32, padding: 32, background: 'var(--bg-page)', alignItems: 'center' }}>
      <OnlineCard />
      <OfflineCard />
      <ErrorCard />
    </div>
  );
}
