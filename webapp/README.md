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

## Vercel deployment (Git integration)

Deployments use **Vercel's Git integration**: Vercel watches this repository and deploys it
automatically. No GitHub Actions workflow and no `VERCEL_TOKEN` secret are involved.

- **Pull requests** get automatic preview deployments from Vercel.
- **Every merge to `main`** triggers a production deployment.
- The Vercel project root is the `webapp/` directory; `webapp/vercel.json` pins the install command,
  build command (`npm run build`) and output directory (`dist`). No Vercel token, org ID or project
  ID is stored in the repository.

### One-time owner setup (Vercel dashboard)

1. In Vercel, choose **Add New → Project** and import the `ikkeflikkeri/software-factory` repository
   (the Vercel GitHub App must have access to it).
2. Under **Build & Output Settings**, set **Root Directory** to `webapp/` so the build runs from that
   folder. The framework preset **Vite** is detected automatically; leave the install command, build
   command (`npm run build`) and output directory (`dist`) as configured in `webapp/vercel.json`.
3. Deploy. From then on, every PR gets a preview deployment and every merge to `main` deploys to
   production automatically.
