# webapp

Vite + React + TypeScript webapp scaffolded from the official `react-ts` template.

## UI components (shadcn/ui + Tailwind CSS)

The app uses [shadcn/ui](https://ui.shadcn.com) with Tailwind CSS v4, installed via the
[official Vite guide](https://ui.shadcn.com/docs/installation/vite). Configuration lives in
`components.json`, the `@/` import alias maps to `src/`, the shared `cn` helper is in
`src/lib/utils.ts`, and generated components live in `src/components/ui/` (currently
`button`, `card` and `input`).

To add more components:

```sh
cd webapp
npx shadcn@latest add <component>   # e.g. npx shadcn@latest add dialog
```

Browse available components at <https://ui.shadcn.com/docs/components>.

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

## Deployment (GitHub Pages)

The webapp deploys to **GitHub Pages** from GitHub Actions — no external hosting account, no
secrets, no Vercel integration. Two workflows build the app from the `webapp/` directory:

- **Production** ([`webapp-pages.yml`](../.github/workflows/webapp-pages.yml)): on every push to
  `main` touching `webapp/`, runs `npm ci` and `npm run build`, then publishes `webapp/dist` to
  GitHub Pages. The site is served under the repository path, so the build passes
  `--base=/<repo name>/` to Vite.
- **Preview** ([`webapp-preview.yml`](../.github/workflows/webapp-preview.yml)): on every pull
  request touching `webapp/`, builds the same way and uploads the output as the
  `webapp-preview-<PR number>` workflow artifact, then comments a download link on the PR.
  GitHub Pages does not host per-PR sites; download the artifact and serve it locally
  (e.g. `npx serve`) to preview a PR.

### One-time setup (repository owner)

- **Settings → Pages**: set **Source** to **GitHub Actions**. This is the only required step;
  there are no tokens or other secrets.

The former Vercel setup (Git integration, CLI workflows, `webapp/vercel.json`) was removed;
`npm run build` still works as before and `dist/` remains the build output.
