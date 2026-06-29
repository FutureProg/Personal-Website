# ADR 0001 — GitHub Activity Stream: Rate-Limit Management

- **Status:** Accepted
- **Date:** 2026-06-28
- **Tracking issue:** [#22](https://github.com/FutureProg/Personal-Website/issues/22)
- **Affected code:** `src/backend/src/githubActivity.ts`, `src/common/GithubActivityEvent.ts`

## Context

The site streams recent GitHub activity to the browser over Server-Sent Events
(`GET /github/activity`). The current implementation polls GitHub **once per
connection**: each poll runs `fetchRepoActivity`, which is
`1 × listForUser` + `up to 5 × listCommits` ≈ **6 requests/minute per connected
visitor** at the default 60s interval.

The cost scales with viewers, not with data. An authenticated token allows
5,000 requests/hour, so the stream saturates at roughly **13 concurrent
visitors**; unauthenticated (60 req/hr) it fails almost immediately.

We want polling demand to be driven by *whether anyone is watching* — not
multiplied by *how many* are watching — and to drop to **zero** when nobody is
connected.

### Runtime (the deciding factor)

The backend is a **single long-lived Node process** deployed to a DigitalOcean
droplet and managed by **pm2** (see `.github/workflows/deploy.yaml` and
`src/backend/ecosystem.config.cjs`). It is **not** a serverless/edge platform.

This matters because it determines what shared state is available:

- **Module-level state is shared** across every request and connection the
  process handles, and persists for the lifetime of the process. A
  module-scoped subscriber set, cache, and poll loop are a sound coordination
  primitive here.
- There is exactly **one** process, so there is no cross-instance coordination
  problem to solve.

> An earlier draft of this ADR assumed the backend ran on **Deno Deploy**, whose
> ephemeral, non-shared-memory isolates would have made module state unreliable
> and forced a coordination layer (Deno KV, `Deno.cron`, `kv.watch`, leases).
> That assumption was wrong — the runtime is a single Node process — so those
> options are not applicable and have been removed. The history is preserved
> below under "Options considered (superseded)".

### Constraints

- **Data source is fixed.** Keep the existing "latest commit per
  most-recently-pushed repo" shape (`listForUser` + `listCommits`). Switching to
  `/users/{user}/events/public` was explicitly ruled out for this work.
- Preserve the existing `GithubActivityEvent` contract
  (`initial` / `update` / `error`); the client must not need changes.
- Existing tests in `githubActivity.test.ts` must keep passing.

## Options considered

### Option A — Status quo: poll-per-connection

Each SSE connection runs its own poll loop against GitHub.

- 👍 Simplest; already implemented; trivially "real-time".
- 👎 Request cost is `N × 6/min`. Saturates the rate limit at ~13 viewers.
- 👎 No deduplication across connections.

**Rejected:** does not scale; the problem we are solving.

### Option B — *(Chosen)* In-process connection-gated shared poller

Hold the poller and its state in module scope, shared by all connections in the
single Node process:

- Module-level **subscriber set**, **refcount**, a single **poll loop**, the
  **last-known snapshot**, and the **`knownShas`** dedup set.
- The first connection starts the loop; additional connections subscribe to it
  and immediately receive the cached snapshot as their `initial` event; the loop
  stops when the last connection disconnects.
- Each poll runs `fetchRepoActivity` (unchanged data source), diffs against
  `knownShas`, and fans new items out to every subscriber as `update` events.

- 👍 Demand-driven — **zero GitHub requests when nobody is connected**.
- 👍 Request cost is **constant (~6/interval) regardless of viewer count**.
- 👍 Real-time feel: the interval can be tightened (~15–30s) without a
  serverless cron's minimum-interval floor.
- 👍 No external dependencies (no KV, cron, or message bus).
- 👎 State is in-memory only: a pm2 restart drops the cache, so the next
  connection triggers one live fetch. Acceptable.

**Chosen.** Correct and simplest for a single-process backend.

### Options considered (superseded)

These were evaluated under the mistaken assumption of a Deno Deploy /
multi-isolate runtime. They are recorded for history but **do not apply** to the
single Node process we actually run.

- **Wall-clock `Deno.cron` poller (always on)** — constant cost but wastes the
  rate budget polling while nobody is on the site; freshness capped at the cron
  interval (1 min minimum).
- **Cron poller gated on a TTL-based liveness set in Deno KV** — cron no-ops
  when no live streams exist; uses per-stream TTL keys (self-healing vs. a
  leaky inc/dec counter) to gate polling and `kv.watch` to fan out across
  isolates. Solved the isolate-coordination problem we don't have.
- **KV lease + leader election + `kv.watch`** — elect one isolate to poll with a
  lease/failover. Correct across many isolates, but far more machinery than a
  single process needs.

With one shared-memory process, the coordination these options provided is free,
so Option B subsumes them.

## Decision

Adopt **Option B**: an in-process, connection-gated shared poller.

The single pm2-managed Node process makes module-level state a reliable shared
coordination point, which removes the need for any of the Deno-specific
coordination machinery. Option B meets every hard requirement — constant cost
regardless of viewer count, zero cost when idle, single shared dedup — with the
least complexity.

## Consequences

**Positive**
- GitHub request volume is one poller's worth (~6 req/interval) for any number
  of viewers.
- Zero GitHub requests when no one is connected.
- Genuinely real-time feel; the interval is a free tuning knob.
- No new infrastructure or external dependencies.
- Instant first paint from the in-memory cache for any connection that arrives
  while the process is warm.

**Negative / trade-offs**
- In-memory state is lost on process restart/redeploy; the next connection pays
  for one live fetch to repopulate. Acceptable for this workload.
- Correctness now depends on the backend remaining a single process. If it is
  ever horizontally scaled to multiple instances, this design must be revisited
  (a shared cache such as Redis, or the superseded KV-coordination approach,
  would then become relevant).

**Future work**
- Add ETag / conditional requests so unchanged polls return `304 Not Modified`,
  which does not count against the rate limit — lets the interval be tightened
  further at no budget cost.
- On 403/429 or transient error, serve the last-good cached snapshot rather than
  emitting `error` to every client, and honour `Retry-After` /
  `X-RateLimit-Reset` to back off.
