# CI Pipeline (`ci.yml`)

This documents the GitHub Actions workflow at `.github/workflows/ci.yml`.

## How it works

The repo has no root `package.json` — it's four independent Node projects
(`Backend`, `Frontend`, `Doctor`, `Admin`), each with its own
`package.json` + `package-lock.json`. The pipeline mirrors that: one job
per backend/frontend concern, each scoped to its own folder via
`working-directory`, so nothing needs a root-level build tool or workspace
config to work.

**Jobs** (all run in parallel — none depends on another):

| Job | Runs against | What it does |
|---|---|---|
| `backend` | `Backend/` | install → audit → build (module-graph check) → test |
| `frontend` | `Frontend/`, `Doctor/`, `Admin/` (matrix) | install → audit → lint → test → build → upload `dist/` |
| `codeql` | whole repo | static security analysis (SAST) |

### Step-by-step

**`backend` job**
1. **Checkout repository** (`actions/checkout@v4`) — clones the commit being built.
2. **Set up Node.js** (`actions/setup-node@v4`, Node 20, matches `Backend/Dockerfile`'s `node:20-alpine`) — also enables npm's built-in dependency cache, keyed off `Backend/package-lock.json`, so repeat runs skip re-downloading unchanged packages.
3. **Install dependencies** — `npm ci`, not `npm install`: it installs exactly what the lockfile specifies and fails outright if `package.json`/`package-lock.json` have drifted, instead of silently re-resolving.
4. **Dependency audit** — `npm audit --audit-level=critical`. Fails the job if any dependency (direct or transitive) has a known **critical**-severity advisory. High/moderate/low are still visible in the log but don't fail the build (see "Known current failure" below for why the threshold is set where it is).
5. **Build** — `npm run build`, which runs `Backend/scripts/verify-build.mjs`. The backend has no bundler (plain ESM Node), so "build" here means importing the entire module graph (every route → controller → model → middleware) and confirming nothing throws a syntax or import-resolution error. It deliberately imports `app.js`, not `index.js` — `app.js` only wires Express middleware/routes and has no top-level side effects (no `.listen()`, no DB connection attempt, no required env var), so this check needs zero secrets or live services.
6. **Run tests** — `npm test --if-present`. See "Tests" below.

**`frontend` job** (matrix: `Frontend`, `Doctor`, `Admin` — same steps, run independently so one app's failure doesn't hide the others'; `fail-fast: false` for the same reason)
1–3. Same as backend (checkout, Node setup + cache keyed to that app's own lockfile, `npm ci`).
4. **Dependency audit** — same `--audit-level=critical` gate, per app.
5. **Lint** — `npm run lint` (`eslint .`).
6. **Run tests** — `npm test --if-present`; none of the three apps currently define a `test` script, so this is a clean no-op today and starts running automatically the moment one is added.
7. **Build** — `npm run build` (`vite build`). Runs with no `VITE_*` env vars set, on purpose — every frontend already falls back to a sane default when they're absent (checked into the source, e.g. `import.meta.env.VITE_API_BASE_URL || "/api/v1/patient"`), and a genuinely fresh clone has no `.env` files at all (they're gitignored). This was verified directly: all three apps were built with their `.env` files removed before this pipeline was written, and all three succeeded.
8. **Upload build artifact** — `actions/upload-artifact@v4` publishes that app's `dist/` folder under the workflow run, named `<App>-dist`, kept for 7 days. `if-no-files-found: error` turns "build silently produced nothing" into a hard failure instead of an empty, misleading "success."

**`codeql` job**
1. Checkout.
2. **Initialize CodeQL** for `javascript-typescript` — one language covers all four apps, since they're all JS/JSX.
3. **Run CodeQL analysis** — scans the checked-out code and uploads findings to the repo's **Security → Code scanning alerts** tab. Uses only the automatic `GITHUB_TOKEN`; the `security-events: write` permission (scoped to just this job, not the whole workflow) is what lets it upload results there.

## How to trigger it

- **Automatically**: push to `main`, or open/update a pull request targeting `main`.
- **Manually re-run**: on GitHub, Actions tab → select the run → "Re-run jobs" (useful after fixing a flaky/transient failure without pushing an empty commit).
- To also run on other branches, broaden the `branches:` filters in the `on:` block.

## Required secrets

**None.** Every step (install, audit, lint, build, test, CodeQL) works from
the checked-out source alone. This is deliberate: it means a contributor's
fork can open a PR and get full CI signal without ever being handed a real
credential, and it keeps this workflow's blast radius at zero even if a
step were ever compromised.

The project *does* have real secrets (`STRIPE_SECRET_KEY`,
`ACCESS_TOKEN_SECRET`, `HCAPTCHA_SECRET_KEY`, `EMAIL_PASS`, etc. — see
`docker-compose.yml` for the full list) but none of them are needed to
install, lint, build, or statically analyze the code — only to actually
*run* it against live services. If a deploy job is ever added to this
workflow, that's when secrets would be introduced, via **Settings → Secrets
and variables → Actions**, referenced as `${{ secrets.NAME }}`, and scoped
to a GitHub Environment with required reviewers if the deploy target is
production.

## Expected output

A green run shows five checks on the PR/commit: `Backend`, `Frontend`,
`Doctor`, `Admin`, `CodeQL`. Each frontend job also leaves a downloadable
`<App>-dist` artifact on the run summary page — useful for grabbing a build
to sanity-check without pulling the branch locally.

## Known current failures (honest status, not a bug in the pipeline)

Adding real CI to a codebase that never had it surfaces existing issues —
that's the pipeline doing its job. As of this workflow being added:

- **`backend` will fail its audit step.** `npm audit` currently reports a
  **critical** advisory in `tar` (pulled in transitively via
  `bcrypt` → `@mapbox/node-pre-gyp` → `tar`). The only fix npm offers
  (`npm audit fix --force`) is a **breaking** `bcrypt` major-version bump,
  which is a real compatibility decision for a maintainer to make
  deliberately — not something to silently force through a CI config.
  Until that's resolved, this job will legitimately stay red.
- **`Frontend`, `Doctor`, and `Admin` will currently fail lint** — there's
  existing lint debt (mostly unused variables/imports, a handful of
  `react-hooks/exhaustive-deps` warnings). Two are more than cosmetic and
  worth prioritizing: `Frontend/src/pages/login.jsx:207` references
  `setPendingRole`, which isn't defined anywhere in that file (a real
  `ReferenceError` waiting to happen on that code path), and
  `Doctor/src/pages/SendOtp.jsx` calls `useState`/`useCallback`
  conditionally, which violates React's Rules of Hooks and can corrupt
  component state. Fixing the lint backlog was out of scope for "add CI"
  (it touches ~25 application files) and wasn't done as a side effect —
  flagging it here instead so it's a visible, deliberate follow-up rather
  than a surprise red pipeline with no explanation.

Everything else — dependency install, the backend build/module-graph check,
frontend builds, and CodeQL — passes cleanly today.

## Common failures and what they mean

| Symptom | Likely cause | Fix |
|---|---|---|
| `npm ci` fails immediately | `package.json` and `package-lock.json` are out of sync | Run `npm install` locally in that app's folder, commit the updated lockfile |
| Audit step fails | A new or existing dependency has a critical advisory | Run `npm audit` locally in that folder, evaluate `npm audit fix` (non-forced) first, decide on forced/major upgrades deliberately |
| Lint step fails | Real lint errors in changed (or pre-existing) code | Run `npm run lint` locally in that app; most are auto-fixable with `npm run lint -- --fix` |
| Frontend build fails but works locally | Almost always an env-var assumption — some new code added `import.meta.env.VITE_X` with no fallback | Add a `\|\| "default"` fallback, matching the existing pattern used everywhere else in these apps |
| Backend build step fails | A new import path is wrong, or a file has a real syntax error | Run `npm run build` locally in `Backend/` — the thrown error's stack trace points at the exact broken import |
| CodeQL job fails to upload results | Missing `security-events: write` permission | Already granted at the job level in `ci.yml`; only relevant if this job is copied elsewhere without that permission block |
