# music-library

A browser-only music library app. Users create an account, add songs to their
personal collection, and browse everything the community has registered.

Deployed at <https://caetanoag.github.io/music-library>.

## Features

- Email/password sign-up and login via Supabase Auth.
- Personal library page with create, edit, and delete for each song.
- Shared "all musics" page showing who added each track.
- Album art and album name fetched from the public iTunes Search API.
- Session persisted in `localStorage`.

## Tech stack

- **Frontend:** HTML5, CSS3, TypeScript, Web Components.
- **Build & dev server:** Bun (`dev/build.ts`, `dev/serve.local.ts`, `dev/serve.ts`).
- **Backend & database:** Supabase (Auth + REST API), accessed with `fetch`.
- **Lint & format:** Biome.

## Project structure

```text
src/                  TypeScript source (single entrypoint: src/main.ts)
  components/         Custom elements (header, footer, music-card)
  db/                 Supabase Auth/REST clients and schema.sql
public/               Deployable site (HTML, CSS, generated JS)
dev/                  Bun build and local/deploy servers
```

`public/js/` is generated from `src/` and committed, so rebuild after changing
any TypeScript file. Do not edit those files by hand.

## Getting started

Requirements: [Bun](https://bun.sh) installed.

```bash
bun install
bun run build
bun run local-serve
```

`local-serve` starts a static server for `public/`, copies the local URL to the
clipboard, and keeps running.

## Scripts

| Script                | Description                                          |
| --------------------- | ---------------------------------------------------- |
| `bun run build`       | Compiles `src/**` into `public/js` (browser target). |
| `bun run local-serve` | Serves `public/` locally on a random port.           |
| `bun run serve`       | Generates a QR code for the deployed Pages URL.      |
| `bun run typecheck`   | Runs `bun check`.                                    |
| `bun run format`      | Formats code with Biome (tabs, double quotes).       |
| `bun run deploy`      | Builds, serves the deployed URL, then formats.       |

## Supabase

Database setup lives in `src/db/schema.sql`. It creates the `songs`,
`playlists`, `song_playlists`, and `profiles` tables, enables row level
security, and adds a trigger that mirrors new Auth users into `profiles`.

The Supabase URL and publishable key are hardcoded in `src/db/supabase.ts`;
there is no `.env` file. Auth and REST calls are made directly through
`fetch`, without `supabase-js`.

## Deployment

Pushing to `main` triggers `.github/workflows/static.yml`, which installs
dependencies, runs `bun run build`, and publishes `public/` to GitHub Pages.
The site is served from the `/music-library/` subpath, so keep asset URLs
relative in HTML and CSS.
