# LL Explorer

Bilingual React app for exploring five German agricultural Living Labs.

The project is now based on a Vite + React app in `app/`. The old single-file wireframe has been retired. Current progress is tracked in [PROJECT-STATUS.md](./PROJECT-STATUS.md), and a plain-English explanation of how the project fits together lives in [OVERVIEW.md](./OVERVIEW.md).

## What this repo contains

- `app/`
  The actual web app.
- `data/`
  Generated data files the app uses.
- `data-pipeline/`
  Python and future R scripts that create or refresh data.
- `docs/`
  Supporting project notes and source docs.

## Current state

- Phase 0: Done
- Phase 1: Done
- Phase 2: Done
- Phase 3: Next

Right now the app includes:

- a landing page with a lightweight SVG overview map
- Living Lab detail pages
- two detail layout options
- English / German language switching
- placeholder charts
- a placeholder LL detail map that will be replaced in Phase 3

## Quick start

All frontend commands run inside `app/`.

### Install

```powershell
cd app
npm install
```

### Start the dev server

```powershell
cd app
npm run dev
```

Open the local URL shown in the terminal.

### Build for production

```powershell
cd app
npm run build
```

Production files are written to `app/dist/`.

### Preview the production build locally

```powershell
cd app
npm run preview
```

## Share For Feedback

This repo is set up to publish the app with GitHub Pages through GitHub Actions.

After you push to `main`:

1. Open the repository on GitHub
2. Go to `Settings` -> `Pages`
3. Under `Build and deployment`, set `Source` to `GitHub Actions`
4. Wait for the `Deploy GitHub Pages` workflow to finish

Your public preview URL should then be:

- `https://<your-github-username>.github.io/LL-explorer/`

That URL is the easiest version to send to non-technical reviewers for feedback.

If you want to verify the production build locally before pushing:

```powershell
cd app
npm run build
npm run preview
```

If the first workflow run fails with a `Get Pages site failed` or `Not Found` error, Pages has not been enabled for the repository yet. Open `Settings` -> `Pages`, switch the source to `GitHub Actions`, then re-run the workflow.

## Everyday editing workflow

For normal small changes:

1. Run `npm run dev` in `app/`
2. Open the local URL
3. Edit a file in `app/src/`
4. Save it

The page should update automatically.

When you may need to do a manual refresh or restart:

- If you change files in `app/public/`, refresh the browser
- If you change dependencies or `vite.config.js`, restart `npm run dev`

## Main app structure

### `app/src/`

- `App.jsx`
  Main app shell and routes
- `main.jsx`
  App entry point
- `i18n.js`
  Translation setup and language persistence
- `theme.js`
  Shared color tokens
- `components/`
  Reusable UI building blocks
- `pages/`
  Top-level screens such as landing and detail pages
- `hooks/`
  Data-loading hooks
- `data/`
  Frontend-side static config like icons, chart placeholders, and layer definitions
- `lib/`
  Small helper utilities for GeoJSON and projection logic
- `styles/`
  Global CSS

### `app/public/`

- `assets/`
  Static brand and icon assets
- `data/`
  Runtime-fetched data used by the app

## Data flow

The frontend does not call Python or R directly.

The flow is:

1. Pipeline scripts write files into `data/`
2. Needed files are copied into `app/public/data/`
3. The React app fetches those files in the browser

Important current frontend data files:

- `app/public/data/ll_metadata.json`
- `app/public/data/nuts1_de.geojson`
- `app/public/data/nuts3_ll_simplified.geojson`

## Data pipeline

The current pipeline lives in `data-pipeline/`.

Main script today:

- `data-pipeline/python/fetch_nuts.py`

That script regenerates the core metadata and GeoJSON files under `data/`.

Basic usage:

```powershell
cd data-pipeline
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python python/fetch_nuts.py
```

After pipeline output changes, copy the needed files into `app/public/data/`.

## Language support

The app currently supports:

- English
- German

The interface text is translated through `app/src/i18n.js`. Living Lab content is read from the bilingual metadata JSON rather than being duplicated into the UI translation file.

## Routing

The app uses `HashRouter`, so the main routes are:

- `#/`
  Landing page
- `#/ll/:slug`
  Living Lab detail page

This keeps deployment simpler for static hosting and TYPO3-style sub-path setups.

## Verification

Current verified frontend commands:

- `npm run lint`
- `npm run build`

## Next planned work

Phase 3 will replace the placeholder detail map with a real `react-leaflet` + PMTiles map.

## Related docs

- [OVERVIEW.md](./OVERVIEW.md)
- [PROJECT-STATUS.md](./PROJECT-STATUS.md)
- [data-pipeline/README.md](./data-pipeline/README.md)
