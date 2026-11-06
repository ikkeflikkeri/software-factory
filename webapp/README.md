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

## Vercel deployment

Deployments to Vercel run through GitHub Actions (`.github/workflows/deploy.yml`), not Vercel's Git
integration. Vercel's Git integration is configured entirely in the Vercel dashboard and could not be
set up from within this repository, while the Actions workflow keeps the trigger rules (deploy only
from `main`) and the project root (`webapp/`) under version control.

### How it works

- **Pull requests** run the CI workflow (`.github/workflows/ci.yml`), which lints and builds the
  webapp. They never deploy to production.
- **A push to `main`** (i.e. a merged PR) runs the deploy workflow, which builds the webapp and
  deploys it to Vercel's production environment with the Vercel CLI. The `webapp/` directory is the
  project root: all commands run with `working-directory: webapp`.

### Required repository secrets

Add these in GitHub under *Settings → Secrets and variables → Actions*. Values come from the Vercel
dashboard (*Project Settings → General*), or run `vercel link` locally to fetch them:

| Secret | Value |
| --- | --- |
| `VERCEL_TOKEN` | A personal access token from [vercel.com/account/tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | The Vercel team/org ID (`orgId` in `.vercel/project.json`) |
| `VERCEL_PROJECT_ID` | The Vercel project ID (`projectId` in `.vercel/project.json`) |

### One-time owner setup

1. Create a Vercel project for this repository (framework preset: **Vite**), with the **Root
   Directory** set to `webapp/` so builds run from that folder.
2. Create a token at [vercel.com/account/tokens](https://vercel.com/account/tokens) and add the
   three secrets listed above to the GitHub repository.
3. Merge a PR to `main` — the deploy workflow then deploys it to production.
