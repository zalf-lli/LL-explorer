# Coding Conventions

**Analysis Date:** 2026-04-29

## Naming Patterns

**Files:**
- Frontend React components (directory `app/src/components/`): PascalCase `.jsx`, e.g. `app/src/components/Header.jsx`, `app/src/components/LandingMap.jsx`, `app/src/components/KPIStrip.jsx`.
- Pages (directory `app/src/pages/`): PascalCase `.jsx`, e.g. `app/src/pages/Landing.jsx`, `app/src/pages/LLDetail.jsx`.
- Multi-file component modules: directory + `index.jsx`, e.g. `app/src/components/LLMap/index.jsx`.
- React hooks (directory `app/src/hooks/`): `use*` camelCase `.js`, e.g. `app/src/hooks/useGeoJSON.js`, `app/src/hooks/useLLMetadata.js`.
- Frontend helper/lib modules (directory `app/src/lib/`): camelCase `.js`, e.g. `app/src/lib/buildMaskGeometry.js`, `app/src/lib/projection.js`, `app/src/lib/geojson.js`.
- Frontend static data (directory `app/src/data/`): `snake_case` `.js`, e.g. `app/src/data/layers.js`, `app/src/data/ll_display.js`, `app/src/data/layer_sources.js`, `app/src/data/landuse_legend.js`, `app/src/data/chart_data.js`.
- Frontend entry + singletons:
  - `app/src/main.jsx`
  - `app/src/App.jsx`
  - `app/src/theme.js`
  - `app/src/i18n.js`
- Generated frontend data modules:
  - `app/src/data/landuse_legend.js`
  - `app/src/data/layer_sources.js`
  These start with `// Generated from ...` and `// Do not edit by hand; run ...` headers.

**Functions:**
- Frontend components and helpers: camelCase for functions and PascalCase for exported component names (e.g. `export function Header(...)` in `app/src/components/Header.jsx`).
- Frontend hooks: `use*` naming (e.g. `useGeoJSON` and `useLLMetadata`).
- Python: snake_case for functions in `data-pipeline/python/` and private helpers prefixed with `_` (e.g. `_download`, `_sha256` in `data-pipeline/python/_sources.py`).

**Variables:**
- Frontend:
  - locals: lowerCamelCase (e.g. `boundaryFeature`, `mapData` in `app/src/components/LLMap/index.jsx` / `app/src/components/LandingMap.jsx`)
  - module-level constants: SCREAMING_SNAKE (e.g. `MAP_STYLE`, `TILE_SUBDOMAINS`, `PMTILES_CACHE` in `app/src/components/LLMap/index.jsx`)
  - color token object is imported as `C` from `app/src/theme.js` and used consistently.
- Python:
  - locals and functions: snake_case
  - module-level constants: SCREAMING_SNAKE (e.g. `STATIC_DATA_FILES` in `data-pipeline/sync.py`)

**Types:**
- No TypeScript in this repo; frontend uses plain JavaScript/JSX (`.js` / `.jsx` in `app/src`).
- Python uses type hints and `from __future__ import annotations` (e.g. `data-pipeline/python/_sources.py`).

## Code Style

**Formatting:**
- Frontend:
  - Tool: Prettier 3.8.3
  - Config: `app/.prettierrc.json`
  - Key settings: `semi: false`, `singleQuote: true`, `printWidth: 100`, `trailingComma: 'es5'`, `tabWidth: 2`
  - Commands (from `app/package.json`):
    - `npm run format`
    - `npm run format:check`
- Pipeline:
  - No formatter config detected. Follow existing Python style in `data-pipeline/python/*.py` (4-space indentation, double quotes, type hints where used).

**Linting:**
- Frontend:
  - Tool: ESLint 10.x
  - Config: `app/eslint.config.js` (flat config)
  - Extends: `@eslint/js` recommended, `eslint-plugin-react-hooks` recommended, `eslint-plugin-react-refresh` for Vite, `eslint-config-prettier`
  - Targets: `**/*.{js,jsx}` (no TypeScript rules)
  - Global ignores: `dist`, `public/data` (via `globalIgnores` in `app/eslint.config.js`)
  - Command: `npm run lint` (from `app/package.json`)

## Import Organization

**Order:**
1. React / React ecosystem imports, e.g. `react`, `react-router-dom`, `react-i18next` (`app/src/App.jsx`, `app/src/pages/LLDetail.jsx`)
2. Other third-party libs, e.g. `leaflet`, `react-leaflet`, `pmtiles` (`app/src/components/LLMap/index.jsx`)
3. Local relative imports (hooks/libs/data/components/pages/theme) with explicit file extensions (e.g. `./hooks/useLLMetadata.js`, `../theme.js`, `./components/Header.jsx`).

**Path Aliases:**
- None configured. Imports are always relative and include file extensions (`app/package.json` sets `"type": "module"` and `app/vite.config.js` does not define aliases).

## Error Handling

**Patterns:**
**Frontend (`app/`):**
- Local storage access is guarded with `try/catch` and intentionally ignored when blocked by browser context.
  - `app/src/i18n.js` (`getInitialLanguage()`), `app/src/App.jsx` (`window.localStorage.setItem(...)`)
- Fetch errors are converted into thrown `Error` objects with contextual messages.
  - `app/src/hooks/useGeoJSON.js` throws `Failed to load ${url}: ${r.status}`
  - `app/src/hooks/useLLMetadata.js` throws `Failed to load ll_metadata.json: ${r.status}`
- Hook state models include `loading` and `error`:
  - `useGeoJSON` uses `{ data, loading, error }` (`app/src/hooks/useGeoJSON.js`)
  - `useLLMetadata` uses `{ lls, bySlug, loading, error }` (`app/src/hooks/useLLMetadata.js`)
- Errors are rendered inline (no global error boundary):
  - Metadata-level error banner in `app/src/App.jsx` (`ErrorBanner`)
  - Map/layer-level fallbacks in `app/src/components/LandingMap.jsx` and `app/src/components/LLMap/index.jsx`

**Python pipeline (`data-pipeline/`):**
- Raise specific exceptions with actionable messages:
  - `KeyError` listing alternatives (`data-pipeline/python/_sources.py`: `get_layer`)
  - `RuntimeError` for missing executables/config issues (`data-pipeline/python/_sources.py`)
  - `FileNotFoundError` for required inputs missing (`data-pipeline/python/_sources.py`: `ensure_input_available`)
  - `SystemExit("Pass --layer <id> or --list")` for missing CLI args (`data-pipeline/python/build_pmtiles.py`)
- Temp directory cleanup retries on `PermissionError`:
  - `cleanup_temp_dir(...)` in `data-pipeline/python/build_pmtiles.py`

## Logging

**Framework:** 
- Frontend: none (`app/src` does not use `console.*`; errors are presented via UI)
- Pipeline: `print()` with bracketed prefixes

**Patterns:**
- Pipeline scripts emit bracketed severity/action tags (e.g. `[sync]`, `[download]`, `[input]`, `[run]`, `[ok]`, `[skip]`, `[warn]`) in:
  - `data-pipeline/sync.py`
  - `data-pipeline/python/_sources.py`
  - `data-pipeline/python/build_pmtiles.py`
  - `data-pipeline/python/fetch_nuts.py`
- One existing warning message uses uppercase `[WARN]` in `data-pipeline/python/fetch_nuts.py`. Prefer lowercase `[warn]` for new messages for consistency.

## Comments

**When to Comment:**
- Generated module headers:
  - `app/src/data/landuse_legend.js`
  - `app/src/data/layer_sources.js`
  (Do not edit by hand; regenerate via `python data-pipeline/sync.py`.)
- Inline comments document intentional React behavior choices:
  - `app/src/components/LandingMap.jsx` (derived-path computation without effect sync)
  - `app/src/pages/LLDetail.jsx` (use of `startTransition` to keep UI responsive)

**JSDoc/TSDoc:**
- Not used in the frontend (`app/src` contains no `/** ... */` JSDoc blocks).

## Function Design

**Size:**
- Frontend: prefer derived computations in `useMemo` and side effects in `useEffect` with cleanup; keep functions focused and avoid storing render-derived values in state.
- Pipeline: keep subprocess / IO steps in dedicated helpers and isolate heavy geospatial imports within functions (e.g. `data-pipeline/python/build_pmtiles.py` imports `geopandas`/`rasterio`/`numpy` inside functions).

**Parameters:**
- Frontend components use destructured props objects and avoid wide positional parameter lists (e.g. `LandingMap({ lls, onPick })`, `LLMap({ ll, layer, height = 300 })`).
- Hooks expose a compact input surface and return an object state model (e.g. `useGeoJSON(urls)`).
- Python uses type hints in function signatures where appropriate (e.g. `data-pipeline/python/_sources.py`).

**Return Values:**
- Frontend hooks return state objects with `loading` and `error`.
  - `app/src/hooks/useGeoJSON.js`, `app/src/hooks/useLLMetadata.js`
- Python helpers return computed values/paths and raise exceptions for failure cases (e.g. `ensure_input_available` returns a `Path` in `data-pipeline/python/_sources.py`).

## Module Design

**Exports:**
- Named exports are the default for hooks and components (e.g. `app/src/hooks/useGeoJSON.js`, `app/src/components/Header.jsx`).
- Default exports are used for:
  - the root app entry (`app/src/App.jsx`)
  - code-split modules loaded with `React.lazy` (`app/src/components/LLMap/index.jsx`, loaded from `app/src/pages/LLDetail.jsx`)

**Barrel Files:**
- Not used. Import the specific module file directly (e.g. `./components/Header.jsx`, `../data/layers.js`).

**Module-level caches:**
- Module-scoped caches dedupe repeated work and are cleared on page reload:
  - Frontend fetch dedupe caches: `app/src/hooks/useGeoJSON.js` (`cache`, `inflight`)
  - Frontend PMTiles instance cache: `app/src/components/LLMap/index.jsx` (`PMTILES_CACHE`)

---

*Convention analysis: 2026-04-29*

# Coding Conventions

**Analysis Date:** 2026-04-29

The repository is a two-part project: a React/Vite frontend in `app/` and an offline Python data pipeline in `data-pipeline/`. Each side has its own conventions; both are documented below.

## Naming Patterns

**Files (frontend, `app/src/`):**
- React components: PascalCase with `.jsx` extension — `Header.jsx`, `LandingMap.jsx`, `KPIStrip.jsx`, `LLBadge.jsx`
- Pages: PascalCase `.jsx` — `Landing.jsx`, `LLDetail.jsx`
- Hooks: camelCase starting with `use`, `.js` extension — `useGeoJSON.js`, `useLLMetadata.js`
- Pure helpers / libs: camelCase `.js` — `buildMaskGeometry.js`, `projection.js`, `geojson.js`
- Static data modules: snake_case `.js` — `ll_display.js`, `ll_icons.js`, `kpi_icons.js`, `landuse_legend.js`, `layer_sources.js`, `chart_data.js`, `layers.js`
- Multi-file component: directory + `index.jsx` — `components/LLMap/index.jsx`
- App-wide singletons at `src/` root: lowercase `.js` — `theme.js`, `i18n.js`, `main.jsx`, `App.jsx`

**Files (pipeline, `data-pipeline/python/`):**
- snake_case `.py` — `build_pmtiles.py`, `fetch_nuts.py`
- Internal helpers prefixed with `_` — `_sources.py`
- Driver scripts at the pipeline root — `data-pipeline/sync.py`

**Functions:**
- Frontend: camelCase — `buildMaskFeature`, `getLLOutlineColor`, `featureToPath`, `normalizeLanguage`
- React components: PascalCase — `LandingMap`, `LLDetail`, `MapInfoControl`, `LayoutSwitcher`
- React hooks: prefixed `use` — `useGeoJSON`, `useLLMetadata`, `useLayerState`
- Python: snake_case — `build_layer`, `ensure_input_available`, `find_pmtiles_bin`
- Python private helpers prefixed with `_` — `_download`, `_sha256`

**Variables:**
- Frontend: camelCase locals (`boundaryFeature`, `outlineColor`, `mapData`); SCREAMING_SNAKE for module-level constants (`STORAGE_KEY`, `LAYOUT_OPTIONS`, `BASEMAP_SOURCE`, `MAP_STYLE`, `WORLD_RING`, `TILE_SUBDOMAINS`, `LAYER_INDEX`, `LL_ORDER`, `LL_DISPLAY`, `LANDUSE_LEGEND`)
- Single-letter `C` is the conventional shorthand for the colour-token object imported from `app/src/theme.js`
- Python: snake_case for variables and functions; module-level constants are SCREAMING_SNAKE (`STATIC_DATA_FILES`, `LL_DEFINITIONS`, `GISCO_URL`)

**Types:**
- No TypeScript — the project is plain JavaScript (`.js` / `.jsx`). No JSDoc/TSDoc patterns are used in the code; editor support comes from `@types/react` and inferred usage.
- Python uses lightweight `from __future__ import annotations` plus inline type hints (`def resolve(path: str | Path) -> Path:`). Not strictly checked.

## Code Style

**Formatting (frontend):**
- Tool: Prettier 3.8.3 — config at `app/.prettierrc.json`
- Settings: `semi: false`, `singleQuote: true`, `trailingComma: 'es5'`, `printWidth: 100`, `tabWidth: 2`, `arrowParens: 'always'`
- Run: `npm run format` (write) or `npm run format:check` (verify) — both invoked from `app/`
- Ignored: `dist`, `node_modules`, `public/data` (see `app/.prettierignore`)
- No semicolons at end of statements is the dominant rule — every `app/src/**/*.jsx` follows this

**Linting (frontend):**
- Tool: ESLint 10.x — flat-config at `app/eslint.config.js`
- Extends: `@eslint/js` recommended + `eslint-plugin-react-hooks` (flat) + `eslint-plugin-react-refresh` (vite preset) + `eslint-config-prettier` (turns off stylistic rules that conflict with Prettier)
- Targets: `**/*.{js,jsx}` — no TypeScript rules
- Globally ignored: `dist`, `public/data`
- Run: `npm run lint` from `app/`
- Inline disables are used sparingly. Example: `app/src/hooks/useGeoJSON.js` disables `react-hooks/exhaustive-deps` for a derived stable key.

**Formatting (pipeline):**
- No formatter or linter is configured. Existing Python files use 4-space indentation, double quotes, type hints, and ~100-character lines. Match that style when adding code.

## CI / Quality Gates

- GitHub Pages workflow at `.github/workflows/deploy-pages.yml` validates only the frontend build (`npm ci` + `npm run build` in `app/`).
- It does not run `npm run lint`, `npm run format:check`, or any tests.
- If you add tests or want consistent quality gates, extend that workflow to run `npm run lint` and `npm run format:check` (and `npm test` once introduced).

## Import Organization

**Order observed in `.jsx` files:**
1. React + React Router + react-i18next (third-party framework hooks)
2. Other third-party libraries (`leaflet`, `react-leaflet`, `pmtiles`)
3. Local hooks (`../hooks/...`)
4. Local libs (`../lib/...`)
5. Local data (`../data/...`)
6. Local components (`./...` or `../components/...`)
7. Theme / styles (`../theme.js`)

Example from `app/src/components/LLMap/index.jsx:1-13`:
```jsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import L from 'leaflet'
import { GeoJSON, MapContainer, TileLayer } from 'react-leaflet'
import { useMap } from 'react-leaflet/hooks'
import { PMTiles, leafletRasterLayer } from 'pmtiles'
import { useGeoJSON } from '../../hooks/useGeoJSON.js'
import { LAYER_INDEX } from '../../data/layers.js'
import { LAYER_SOURCE_INDEX } from '../../data/layer_sources.js'
import { getLLOutlineColor } from '../../data/ll_display.js'
import { buildMaskFeature } from '../../lib/buildMaskGeometry.js'
import { C } from '../../theme.js'
import { MapLegend } from '../MapLegend.jsx'
```

**Path style:**
- Always relative paths (`../theme.js`, `./components/Header.jsx`).
- No path aliases (`@/...`) configured in `app/vite.config.js` (no `jsconfig.json`/`tsconfig.json` path mapping detected).
- Always include the file extension (`.js`, `.jsx`) — required because `"type": "module"` is set in `app/package.json`.

**Python imports (data-pipeline):**
- `from __future__ import annotations` first
- Stdlib next (`json`, `shutil`, `pathlib`, etc.) — alphabetised
- Blank line, then third-party (`requests`, `yaml`, `geopandas`)
- Blank line, then local (`from python._sources import ...` from the repo root, `from _sources import ...` when running scripts in-place)
- Heavy geospatial deps (`numpy`, `rasterio`, `geopandas`, `mercantile`) are imported **inside** functions to keep CLI startup fast — see `build_pmtiles.py:38`, `:50-55`, `:144-148`. Match this pattern when adding new pipeline steps.

## Error Handling

**Frontend:**
- Network/data errors flow through hook state: `{ data, loading, error }` is the canonical shape — see `app/src/hooks/useGeoJSON.js:31-43` and `app/src/hooks/useLLMetadata.js:48-61`.
- Errors are bubbled up to a calling component which renders an inline message (no global error boundary) — `app/src/App.jsx:29-31` shows the metadata-error banner; `app/src/components/LandingMap.jsx:41-47` and `app/src/components/LLMap/index.jsx:307-316` show layer-level fallbacks.
- `try/catch` with empty-comment-only handlers is acceptable for storage access:
  ```js
  try { window.localStorage.setItem(STORAGE_KEY, lang) }
  catch { /* Ignore storage access issues in restricted browser contexts. */ }
  ```
  See `app/src/App.jsx:17-21` and `app/src/i18n.js:11-17`.
- Network failures are rethrown with contextual messages in hooks:
  - `app/src/hooks/useGeoJSON.js` throws `Failed to load ${url}: ${r.status}`.
  - `app/src/hooks/useLLMetadata.js` throws `Failed to load ll_metadata.json: ${r.status}`.

**Python pipeline:**
- Raise specific exceptions with actionable messages:
  - `RuntimeError` for environment/config problems with a suggested fix — `data-pipeline/python/_sources.py:54-57` (PMTiles CLI missing), `:74-76` (rasterio CLI missing).
  - `FileNotFoundError` when a required input is absent — `_sources.py:126-128`.
  - `KeyError` with the list of valid alternatives — `_sources.py:43-44`.
  - `SystemExit("Pass --layer <id> or --list")` for missing CLI args — `build_pmtiles.py:294`.
- Defensive checks log `[warn]` to stdout and continue when a mismatch is recoverable — `build_pmtiles.py:69-70`.
- File-system retries: `cleanup_temp_dir` retries on `PermissionError` (Windows) — `build_pmtiles.py:237-250`. Reuse this helper for any temp-dir cleanup.

## Logging

**Frontend:**
- Framework: none. No `console.log`/`console.warn`/`console.error` usage observed in `app/src/`. User-facing errors render to the DOM.

**Pipeline:**
- Plain `print()` with bracketed tag prefixes acting as severity:
  - `[sync]` — file copy / generated output (`sync.py:22`, `:44`, `:82`)
  - `[fetch]` / `[download]` — network step (`fetch_nuts.py:83`, `_sources.py:107-109`)
  - `[cache]` — cache hit / write (`fetch_nuts.py:81`, `:93`)
  - `[run]` — external subprocess invocation (`build_pmtiles.py:173`, `:233`)
  - `[ok]` — successful completion with summary stats (`build_pmtiles.py:227`, `:283-285`)
  - `[skip]` — non-fatal skip (`sync.py:95`)
  - `[warn]` — recoverable problem (`build_pmtiles.py:70`, `:250`)
  - `[input]` — input resolution (`_sources.py:121-123`)
- Note: `data-pipeline/python/fetch_nuts.py` currently prints one warning line with `[WARN]` (uppercase); prefer `[warn]` for new messages.
- Use the same prefix scheme when adding new pipeline steps — it gives `python -u` output a consistent look.

## Comments

**When to comment:**
- File-top block comments explain the *why* of a module, not the *what* — see `app/src/lib/projection.js:1-7`, `app/src/lib/buildMaskGeometry.js:1-12`, `app/src/data/ll_display.js:1-8`, `app/src/data/chart_data.js:1-3`.
- Inline comments mark non-obvious decisions:
  - Caching/perf trade-offs (`useGeoJSON.js:48`, `useLLMetadata.js:5`)
  - Phase markers for unfinished work (`KPIStrip.jsx:28` — "Temporary placeholder source; Phase 4 pipeline will populate real values.")
  - Known issues / verifications needed (`fetch_nuts.py:47-48`, `:73`)
  - Layout/UI rationale (`LLDetail.jsx:131` — "startTransition keeps the map/chart swap non-blocking")
- Generated-file banners are mandatory at the top of any auto-generated module:
  ```
  // Generated from data-pipeline/sources/sources.yaml.
  // Do not edit by hand; run `python data-pipeline/sync.py` after changing sources.yaml.
  ```
  Pattern at `app/src/data/layer_sources.js:1-2` and `app/src/data/landuse_legend.js:1-2`.

**JSDoc / TSDoc:**
- Not used. Plain prose comments only.

**Python docstrings:**
- Module-level docstring at the top of any executable script — see `data-pipeline/python/fetch_nuts.py:1-11`.
- Single-line function docstrings for non-obvious behaviour — `simplify_features` at `fetch_nuts.py:115-116`, `generate_layer_sources` at `sync.py:48`.

## Function Design

**Size:** Functions are small and single-purpose. Most are 5–40 lines. The largest pure-logic functions sit in `data-pipeline/python/build_pmtiles.py` (`build_paletted_geotiff`, `build_mbtiles`) and stay <100 lines because subordinate concerns are extracted into helpers (`hex_to_rgba`, `build_colormap`, `build_clip_geometry`).

**Parameters:**
- Frontend: components take a single destructured props object with default values inline — `function LLBadge({ slug, size = 'md' })`, `function MapLegend({ layer })`, `function LLMap({ ll, layer, height = 300 })`. Avoid more than ~5 props on a single component; pass a domain object (`ll`) instead of spreading 10 fields.
- Python: positional + keyword args with type hints. Use `dict` for layer config bundles loaded from YAML.

**Return values:**
- Custom hooks return `{ data, loading, error }` (or a domain-specific superset like `{ lls, bySlug, loading, error }`).
- Pure helpers return plain values (paths, GeoJSON features, projected coordinates).
- Python: explicit `Path` return types where files are involved; `tuple` where multiple values are needed (`bounds` from `build_paletted_geotiff`).

**Components:**
- Render-derived state is computed in `useMemo`, never via `useEffect` + `setState` — see the comment at `LandingMap.jsx:24` ("rerender-derived-state-no-effect"). Follow this rule: if a value can be computed from props, do not store it in state.
- Side effects (event listeners, layer mutations on the Leaflet map) live in `useEffect` and always return cleanup functions — `LLMap/index.jsx:55-65`, `:170-185`.
- Non-blocking state transitions for expensive child swaps use `startTransition` — `LLDetail.jsx:131`.

## Module Design

**Exports:**
- Named exports are the default for components, hooks, and helpers — `export function Header(...)`, `export function useGeoJSON(...)`.
- Default exports are reserved for:
  - The root `App` component (`App.jsx:10`)
  - Code-split modules consumed via `React.lazy` — `LLMap/index.jsx:279` exports `default function LLMap` because it is loaded by `lazy(() => import('../components/LLMap/index.jsx'))` in `LLDetail.jsx:12`.
- Frozen / lookup-style data exports as `const` plus an indexed `Map`:
  ```js
  export const LAYERS = [...]
  export const LAYER_INDEX = new Map(LAYERS.map((l) => [l.id, l]))
  ```
  See `app/src/data/layers.js:3-15` and `app/src/data/layer_sources.js:24`. Use this pattern any time consumers need O(1) lookup by id.

**Barrel files:**
- Not used. There is no `app/src/components/index.js`. Always import from the specific file (`'../components/Header.jsx'`).

**Module-level caches:**
- Module-scoped `Map` / variable caches are used to dedupe network requests and shared instances — `useGeoJSON.js:3-4` (cache + inflight), `useLLMetadata.js:5-6`, `LLMap/index.jsx:17` (`PMTILES_CACHE`). Reset is not needed; the page reload clears them.

---

*Convention analysis: 2026-04-29*
