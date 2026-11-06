# webapp

Vite + React + TypeScript webapp scaffolded from the official `react-ts` template.

## Run

```sh
cd webapp
npm install
npm run dev      # start the dev server
npm run build    # type-check and build for production
npm run lint     # lint the source
npm run preview  # preview the production build
```

## CI checks

GitHub Actions runs the webapp checks on every pull request and on every push to `main`
that changes files under `webapp/` (`.github/workflows/webapp-ci.yml`).

The [webapp-ci](../../actions/workflows/webapp-ci.yml) workflow runs in `webapp/`:

1. `npm ci` — install dependencies from the lockfile
2. `npm run lint` — lint the source
3. `npm run build` — type-check (via `tsc -b`) and build for production

There is no separate `npm test` or `npm run typecheck` script; `npm run build` covers
type-checking.

## Vercel deployment (GitHub Actions + Vercel CLI)

Deployments run in GitHub Actions with the Vercel CLI; the Vercel Git integration is no longer used.
Two workflows deploy the app from the `webapp/` directory:

- **Preview** ([`vercel-preview.yml`](../.github/workflows/vercel-preview.yml)): on every pull
  request touching `webapp/`, runs `vercel pull --environment=preview`, `vercel build`,
  `vercel deploy --prebuilt`, and posts the preview URL as a comment on the PR.
- **Production** ([`vercel-production.yml`](../.github/workflows/vercel-production.yml)): on every
  push to `main` touching `webapp/`, runs `vercel pull --environment=production`,
  `vercel build --prod`, `vercel deploy --prebuilt --prod`.

The workflows run the Vercel CLI from the repository root: the project's root directory is set to
`webapp/` in the Vercel dashboard, and the CLI resolves that path relative to its working directory
(running it inside `webapp/` would make it look for `webapp/webapp`).

The Vercel CLI performs its own dependency install during `vercel build` (using the
`installCommand` from `webapp/vercel.json`), so the workflows do not run `npm ci` before it.
`webapp/vercel.json` keeps the Vite framework preset, install/build commands and output
directory; the `.vercel/` link directory it generates locally is git-ignored and never committed.

### Required repository secrets

These three secrets must be configured by the repository owner under
**Settings → Secrets and variables → Actions** before the deploy workflows can run
(no values are stored in the repository):

- `VERCEL_TOKEN` — a Vercel access token
- `VERCEL_ORG_ID` — the Vercel team/user ID
- `VERCEL_PROJECT_ID` — the Vercel project ID

The token is passed only as an environment variable / CLI flag and is never printed.
Automatic Git deployments for this project must be disabled in the Vercel dashboard so that
only the GitHub Actions workflows deploy it.
