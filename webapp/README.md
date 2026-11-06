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
