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

Two forces make this a problem:

1. **Cost scales with viewers, not with data.** An authenticated token allows
   5,000 requests/hour, so the stream saturates at roughly **13 concurrent
   visitors**. Unauthenticated (60 req/hr) it fails almost immediately.
2. **The backend runs on Deno Deploy.** Requests are served by a fleet of
   ephemeral, globally distributed **isolates** that do **not** share memory.
   In-process state (a counter, a cache, a subscriber set) is per-isolate and
   non-synchronized, so it cannot be relied on to coordinate polling across the
   deployment. See the
   [Deno Deploy parallelism notes](https://docs.deno.com/examples/http_server_parallel/).

We want polling demand to be driven by *whether anyone is watching* — not
multiplied by *how many* are watching, nor by *how many isolates* happen to be
serving them — and to drop to **zero** when nobody is connected.

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

- 👍 Simplest; already implemented; trivially "real-time" (tunable interval).
- 👎 Request cost is `N × 6/min`. Saturates the rate limit at ~13 viewers.
- 👎 No deduplication across connections or isolates.

**Rejected:** does not scale; the problem we are solving.

### Option B — Wall-clock cron poller (always on)

A `Deno.cron` job polls GitHub on a fixed schedule regardless of traffic, caches
to Deno KV, and connections read the cache.

- 👍 Constant, predictable request cost; single logical poller.
- 👎 Burns rate budget polling **even when nobody is on the site**.
- 👎 Freshness capped at the cron interval.

**Rejected:** wasteful when idle, which for a personal portfolio is most of the
time.

### Option C — Connection-gated shared poller (per-isolate module state)

First connection starts one shared poll loop in module scope; additional
connections subscribe to it; the loop stops on last disconnect.

- 👍 Demand-driven; zero cost when idle; fast/real-time interval possible.
- 👍 Collapses N connections to one loop **within an isolate**.
- 👎 Module state is per-isolate on Deno Deploy. With traffic spread across K
  isolates you get **K independent pollers** (K × cost), and a commit detected
  by one isolate never reaches viewers on another. Correctness depends on all
  traffic landing on a single isolate — an assumption Deno Deploy explicitly
  breaks.

**Rejected:** relies on single-isolate behaviour that is not guaranteed.

### Option D — Cross-isolate coordination via KV lease + `kv.watch`

Elect one isolate to poll using a KV lease/lock with expiry and failover; share
the snapshot and seen-SHA set in KV; propagate updates to all isolates with
`kv.watch`.

- 👍 Correct across any number of isolates; constant cost; supports a fast
  interval; survives leaseholder death via lease expiry.
- 👎 Substantial complexity: lease acquisition/renewal, failover, a
  cross-isolate liveness count to know when to stop, and the edge cases in all
  of the above. Heavy for this site's scale.

**Rejected (for now):** correct, but more machinery than the requirement
justifies. Kept as the upgrade path if sub-minute freshness becomes a
requirement.

### Option E — *(Chosen)* Cron poller gated on a TTL-based liveness set in KV

Combine the simplicity of the cron (Option B) with demand-gating, using KV for
the small amount of shared state that genuinely needs to cross isolates:

- A single global **`Deno.cron`** job. Cron handlers fire **once per tick across
  the whole deployment**, not per isolate — so we get a single logical poller
  for free, with no leader election or lease.
- A **TTL-based liveness set** in Deno KV gates the cron: each stream writes a
  `["streams", streamId]` key with a ~90s TTL and heartbeats it (~30s) while
  connected; it is deleted on disconnect. The cron polls GitHub only when at
  least one non-expired stream key exists, and **no-ops otherwise** → zero
  requests when idle.
- The cron writes the activity snapshot to KV with an expiring cache entry.
- SSE handlers serve the KV snapshot as the `initial` event and `kv.watch` the
  activity key to fan `update`s out to their local connections.

## Decision

Adopt **Option E**.

It satisfies every hard requirement — constant cost regardless of viewer and
isolate count, zero cost when idle, correct cross-isolate delivery — while
avoiding the lease/leader-election complexity of Option D. The cron's
once-per-deployment guarantee removes the single-isolate assumption that sank
Option C.

### Why TTL keys instead of an increment/decrement counter

A naïve "`+1` on stream start, `−1` on stream end" counter is correct only if
every start is paired with an end. On Deno Deploy it won't be: an isolate
recycle or crash, or a dropped connection whose abort handler never fires, loses
the decrement. The counter then ratchets upward and **never returns to 0**,
leaving the cron polling forever — defeating the entire point of gating.

Per-stream keys with a TTL are **self-healing**: a dead isolate's keys simply
expire, and liveness reflects reality without any manual bookkeeping.

## Consequences

**Positive**
- GitHub request volume is one poller's worth (~6 req/tick) for any number of
  viewers across any number of isolates.
- Zero GitHub requests when no streams are live.
- Self-healing liveness; the poller cannot get stuck "on" after a crash.
- Instant first paint from the KV snapshot, even on a cold isolate.
- ETag/conditional requests make most ticks return `304`, which does not count
  against the rate limit.

**Negative / trade-offs**
- **Freshness is capped at ~60s** by `Deno.cron`'s 1-minute minimum interval —
  coarser than the fast interval Options C/D could offer. Accepted: commit
  activity on a portfolio does not need sub-minute latency, and the simplicity
  win is large.
- Introduces a hard dependency on Deno KV (cache, snapshot, liveness set) and on
  `kv.watch` for fan-out.
- More moving parts than the status quo (cron + heartbeats + watch), though far
  fewer than the lease approach.

**Future work**
- If sub-minute freshness is ever required, revisit **Option D** (KV lease +
  fast poll) — the data model (KV snapshot + liveness) largely carries over.
- Honour `Retry-After` / `X-RateLimit-Reset` to back the cron off during
  throttling, and always serve the last-good KV snapshot on error rather than
  surfacing `error` to every client.
