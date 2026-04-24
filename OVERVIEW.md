# Project Overview

This file explains the project in simple terms.

## What this app is

LL Explorer is a small website that lets a person:

- see the five Living Labs on a landing page
- click into one Living Lab
- read basic information about it
- switch the interface between English and German

At the moment, some parts are still placeholders. The biggest one is the detailed interactive map, which is planned for the next phase.

## The big idea

You can think of the project as three connected parts:

1. `data-pipeline/`
   This creates or refreshes data files.
2. `data/`
   This stores the generated data files.
3. `app/`
   This is the website people actually use.

So the project works like this:

- scripts prepare data
- data files are stored in the repo
- the React app reads those files and shows them in the browser

## What the user sees

### Landing page

The landing page is the homepage. It shows:

- the title and intro text
- a simple Germany overview map
- cards for the five Living Labs

From there, the user can choose a Living Lab.

### Living Lab detail page

Each Living Lab has its own detail page. It shows:

- the Living Lab name
- summary values
- placeholder charts
- text sections
- a map area

Right now the detail map is still a placeholder. The real map comes in Phase 3.

## How the app is organized

### `app/`

This is the frontend app.

Important parts inside it:

- `app/src/App.jsx`
  The main shell of the app. It connects routes, header, pages, and language.
- `app/src/pages/`
  Full-page screens.
- `app/src/components/`
  Smaller reusable pieces like the header, badges, tabs, charts, and map wrappers.
- `app/src/hooks/`
  Reusable data-loading logic.
- `app/src/data/`
  Small frontend-side data files like icon definitions, chart placeholder data, and layer config.
- `app/public/data/`
  JSON and GeoJSON files that the app fetches in the browser.

### `data/`

This holds the data outputs that belong to the project itself.

Examples:

- metadata about the Living Labs
- GeoJSON boundaries
- future PMTiles map files

### `data-pipeline/`

This holds the scripts that prepare data.

Today, the most important script is:

- `data-pipeline/python/fetch_nuts.py`

Its job is to generate the metadata and region boundary files the app needs.

### `docs/`

This is for supporting notes and planning documents.

## How the app gets its content

The app does not hardcode everything.

Some things are built into the frontend:

- colors
- icons
- placeholder chart values
- UI layout

Some things are loaded from data files:

- Living Lab names and taglines
- bilingual Living Lab metadata
- Germany and Living Lab region boundaries

That means the app can keep its structure while the content files are updated separately.

## How language works

The app supports English and German.

There are two kinds of text:

1. Interface text
   Things like buttons, labels, headings, and loading messages.
   This is handled in `app/src/i18n.js`.
2. Living Lab content
   Things like the name, tagline, and descriptions for each lab.
   This comes from `ll_metadata.json`, which already contains English and German content.

The chosen language is saved in the browser so the app remembers it after reload.

## How navigation works

The app uses URL routes.

Main routes:

- `#/`
  homepage
- `#/ll/east-brandenburg`
  example detail page

The `#` in the URL is there on purpose. It makes static deployment easier because the server does not need special route handling.

## How this could fit into zukunft-land.org

The live Zukunft Land site already gives us some useful clues about integration.

As of April 24, 2026, the public site:

- has a German homepage at `/`
- has an English homepage at `/en/`
- is mainly a long landing page with sections like Vision, Reallabore, Mitmachen, Jobs, and Kontakt
- links out to legal pages such as `impressum.html` and `datenschutz.html`
- is still marked as "under construction"

That means this app should probably be added in one of two ways.

### Option 1: dedicated TYPO3 page

This is the better fit for the current React app.

Why:

- the app already has its own app shell and header
- it uses `HashRouter`, so TYPO3 does not need to understand React sub-routes
- Vite is configured with a relative base path, which helps when the app lives in a TYPO3 subfolder

In practice, this would look like:

- TYPO3 gets a new page for the explorer in German
- TYPO3 gets a matching English page
- the built app files from `app/dist/` are published into the TYPO3 site package or extension
- TYPO3 outputs a mount element and includes the built JS and CSS files

Possible page locations could be something like:

- `/reallabore/explorer`
- `/en/living-labs/explorer`

This also fits the live site structure well, because the explorer is closely related to the existing "Reallabore" section and can be linked from there without forcing it into the homepage layout.

### Option 2: embedded inside an existing TYPO3 page

This is possible, but it is not the best fit for the app exactly as it exists today.

Right now the app behaves like a full page. It has its own header and uses a full-height layout. If it is embedded into an existing TYPO3 content column, it may feel like a site inside a site.

For a good embedded version, the React app should get an "embed mode" that:

- hides the React header
- removes the full viewport height layout
- lets TYPO3 provide the page heading, breadcrumbs, and surrounding content
- optionally starts on a chosen Living Lab instead of always showing the landing page first

Without that work, a dedicated page is cleaner.

### TYPO3 integration details

Assuming the main website is managed in TYPO3, the deployment model should be:

1. Build the React app with `npm run build` inside `app/`
2. Copy the built files from `app/dist/` into a TYPO3 public asset folder
3. Copy `app/public/data/` outputs as well, because the app fetches JSON and GeoJSON files at runtime
4. Render a mount element in TYPO3, then load the built JS and CSS

Important details:

- Because the app uses hash routes like `#/ll/east-brandenburg`, TYPO3 only needs to serve the page itself. React handles the view changes after load.
- Because the app loads data with relative paths, the data files should sit alongside the built app in the deployed TYPO3 asset structure.
- If TYPO3 uses language-specific pages, it is better to mount the same built app on both the German and English pages than to create two separate frontend builds.
- Because Vite build filenames are usually hashed, TYPO3 should either read a build manifest or be updated to point at the current built asset filenames after each release.

### Best recommendation for this project

For the current codebase, the most realistic first integration is:

- add the explorer as a dedicated TYPO3 page
- link to it from the existing "Reallabore" area on `zukunft-land.org`
- provide one German TYPO3 page and one English TYPO3 page

Then, if needed later, the React app can be adjusted for a more native embedded mode.

### Fast fallback

If a very fast first rollout is needed, the app could also be hosted as a separate static build and embedded in TYPO3 with an `iframe`.

That is the lowest-effort option, but it is usually worse for:

- visual consistency
- responsive sizing
- analytics
- accessibility
- long-term maintenance

So it should be treated as a temporary fallback, not the preferred final setup.

## What happens when you edit the app

When you run:

```powershell
cd app
npm run dev
```

Vite starts a local development server.

Then:

- you edit a file in `app/src/`
- save it
- the browser updates automatically

For most normal edits, that is all you need.

## What is finished and what is not

Finished:

- app scaffold
- component-based React structure
- landing page
- detail pages
- bilingual UI toggle
- metadata loading

Not finished yet:

- real Leaflet map on the detail page
- PMTiles-based thematic map layers
- fuller data pipeline structure
- final documentation pass across the whole repo

## In one sentence

This project is now a working React app that reads Living Lab data from local project files, shows it in English and German, and is ready for the next step: adding the real interactive map.
