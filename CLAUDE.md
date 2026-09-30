# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Disappearing Notes** — a static web app where users write notes that are automatically deleted after 1 day. No server, no backend. Deployed via GitHub Pages.

## Tech Stack

- HTML + JavaScript (a build tool / bundler is acceptable if it speeds up development)
- Data persistence: `localStorage` only
- Hosting: GitHub Pages (static files served directly from `main` branch or `docs/` folder)

## Architecture

All logic lives in the browser. There is no server-side component.

**UI:** A single full-viewport `<textarea>` — no buttons, no chrome. Each line the user types is an independent note.

**Storage model:** Lines are stored in `localStorage` (key `disappearing-notes-lines`) as a JSON array of `{ text: string, createdAt: number }`. Line index in the array corresponds to line index in the textarea.

**Expiration logic:** On load and every 10 seconds, lines older than `TTL_MS` (24 h) are filtered out. The textarea is updated in-place, preserving the cursor position.

**Sync strategy (`syncLines`):** On every `input` event the textarea is split by `\n` and reconciled with the stored array positionally — existing lines keep their original `createdAt`, new lines get `Date.now()`.

**GitHub Pages deployment:** The repo should serve from the root of `main` (or a `/docs` subfolder). `index.html` must be at the entry point. No `jekyll` processing needed — add a `.nojekyll` file if any path uses underscores.

## Commands

```bash
npm install       # install dependencies (Vite)
npm run dev       # start dev server at http://localhost:5173
npm run build     # production build → dist/
npm run preview   # preview the production build locally
```

## Development

To test expiration without waiting a day, temporarily lower `TTL_MS` in `src/notes.js` (e.g. to `10_000` for 10 seconds), or manipulate `localStorage` directly via browser DevTools (`Application → Local Storage`).

## Deployment

`.github/workflows/deploy.yml` builds on every push to `main` and deploys `dist/` via the GitHub Pages Actions deployment environment.

**One-time repo setup required:**
1. In repo Settings → Pages → Source, select **GitHub Actions**.
2. Confirm `base` in `vite.config.js` matches the repository name (currently `/dissapearing-notes/`).
