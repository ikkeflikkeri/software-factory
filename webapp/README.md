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
3. `npm test` — run the vitest suites
4. `npm run build` — type-check (via `tsc -b`) and build for production

`npm run build` covers type-checking; `npm test` covers the unit and component tests.

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

## Google sign-in

The dashboard is restricted to signed-in users. Sign-in uses Google Identity
Services (GIS) with the ID-token credential model: the browser renders the
official "Sign in with Google" button, Google returns a JWT ID token, and the
app keeps it in `localStorage` until it expires. **No client secret is used**
— a browser app is a public client, so only the public client ID reaches the
browser.

### Setup (repository owner)

1. In the [Google Cloud Console](https://console.cloud.google.com/) create (or
   pick) a project and configure the **OAuth consent screen** (External, with
   your Google account as a test user).
2. Under **APIs & Services → Credentials** create an **OAuth 2.0 Client ID** of
   type **Web application**.
3. Add every origin the app is served from under **Authorized JavaScript
   origins**, e.g. `http://localhost:5173` (local dev) and
   `https://<owner>.github.io` (GitHub Pages). No redirect URIs are needed.
4. Copy the client ID into `webapp/.env` (see `.env.example`) for local
   development:

   ```
   VITE_GOOGLE_CLIENT_ID=<your-client-id>.apps.googleusercontent.com
   ```

5. For the deployed build, expose the same variable in the hosting
   environment: with Vercel, add it to the project's environment variables;
   with GitHub Pages, add a `VITE_GOOGLE_CLIENT_ID` secret to the repository
   and pass it to the build without printing it.

Never commit `.env` or paste the client ID into issues, PRs or logs — the
value is public in the browser, but keeping it out of the repo keeps deploys
configurable per environment. (A client secret must never be created for this
flow; if your credential has one, do not expose it to the browser.)

### How the gate works

- When `VITE_GOOGLE_CLIENT_ID` is **set**, signed-out visitors see the
  sign-in page instead of any dashboard route. The signed-in user's name and
  avatar appear in the top bar with a sign-out button.
- When it is **unset** (no sign-in configured), the dashboard stays publicly
  accessible — the feature is off, not locked.
- The session is the ID token plus display fields in `localStorage`
  (`software-factory.google-session`); it is dropped when its `exp` claim
  passes, and a failed sign-in (script load error or rejected token) shows an
  error message instead of crashing.
- Trade-off: this is a **client-side gate** — it restricts the UI, not the
  static files themselves (the dashboard only reads public GitHub data, so no
  private data is exposed). Enforcing access at the server would require a
  backend or host-level auth, out of scope for a static SPA.

## SPA routing on static hosts

The dashboard uses client-side routes (e.g. `/deployments`). Static hosts must serve
`index.html` for unknown paths so deep links work on reload; otherwise the app only works
when entering through the root URL.

- **GitHub Pages** cannot rewrite URLs, so the `postbuild` script copies `dist/index.html`
  to `dist/404.html`. GitHub Pages serves `404.html` (with a 200-level body) for unknown
  paths, the app boots, and the router shows the custom 404 page for genuinely unknown
  routes. This requires no extra setup and is included in every build (Pages and preview
  artifacts both run `npm run build`).
- **Vercel** (if used again): add a `webapp/vercel.json` with
  `{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }` so every path is
  handled by the app instead of the host's 404.

## Testing

```sh
cd webapp
npm test    # run vitest suites (routing, error boundary, pages, lib helpers)
```
