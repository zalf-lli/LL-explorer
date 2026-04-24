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
