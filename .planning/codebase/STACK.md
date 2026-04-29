# Technology Stack

**Analysis Date:** 2026-04-29

## Languages

**Primary:**
- JavaScript (ES2022, ESM modules) — frontend app in `app/src/` (React JSX, `.jsx` and `.js` files only; no TypeScript)
- Python 3.12 — geodata pipeline in `data-pipeline/python/` and `data-pipeline/sync.py`

**Secondary:**
- HTML — single static entry point at `app/index.html`
- CSS — global styles at `app/src/styles/global.css` plus inline style objects driven by `app/src/theme.js`
- YAML — declarative source registry at `data-pipeline/sources/sources.yaml`
- R — placeholder folder `data-pipeline/R/` reserved for future R-based fetchers (no R implementation detected)

## Runtime

**Browser:**
- Modern evergreen browsers (no polyfills configured); React 19 with Strict Mode enabled at `app/src/main.jsx`

**Node.js:**
- Node 22 in CI per `.github/workflows/deploy-pages.yml` line 29 (`node-version: 22`)
- No `.nvmrc` or `engines` field in `app/package.json`; local Node version is implicit

**Python:**
- Python 3.12 (explicitly required for Windows geospatial wheel compatibility per `data-pipeline/README.md` lines 37-49)
- Virtual environment lives at `data-pipeline/.venv/` (gitignored)

**Package Managers:**
- npm — frontend; lockfile present at `app/package-lock.json` (committed)
- pip — Python; unpinned/range-specs in `data-pipeline/requirements.txt`; no lockfile (manual fallback install order documented in `data-pipeline/README.md` lines 86-94)

## Frameworks

**Core (frontend):**
- React 19.2.5 (`app/package.json` line 20) — UI framework
- React DOM 19.2.5 (`app/package.json` line 21)
- React Router DOM 7.9.6 (`app/package.json` line 24) — `HashRouter` based routing for static-host friendliness (`app/src/App.jsx` line 25)
- Vite 8.0.10 (`app/package.json` line 37) — dev server and build tool, configured at `app/vite.config.js` with `base: './'` for relative-path deploys (TYPO3 sub-path)
- `@vitejs/plugin-react` 6.0.1 — React Fast Refresh / JSX

**Internationalization:**
- i18next 26.0.7 (`app/package.json` line 17)
- react-i18next 17.0.4 (`app/package.json` line 22)
- Configured at `app/src/i18n.js` with hardcoded EN/DE resource bundles (no translation file loading); language persistence via `localStorage` key `ll-explorer-lang`

**Mapping (frontend):**
- Leaflet 1.9.4 (`app/package.json` line 18) — base map engine; CSS imported in `app/src/main.jsx` line 4
- react-leaflet 5.0.0 (`app/package.json` line 23) — React bindings
- pmtiles 4.3.0 (`app/package.json` line 19) — Protomaps PMTiles raster overlay loader; imported as `PMTiles` and `leafletRasterLayer` in `app/src/components/LLMap/index.jsx` line 6

**Geodata (Python pipeline):**
- geopandas >= 0.14 (`data-pipeline/requirements.txt`) — vector clipping/dissolving in `fetch_nuts.py` and `build_pmtiles.py`
- shapely >= 2.0 — geometry operations
- rasterio >= 1.3 — raster IO, reprojection, masking in `data-pipeline/python/build_pmtiles.py`
- rio-mbtiles >= 1.6 — declared in requirements (current MBTiles writer in `build_pmtiles.py` uses `sqlite3` + `mercantile` directly; `rio-mbtiles` is retained for compatibility)
- requests >= 2.31 — HTTP fetch (GISCO NUTS download in `fetch_nuts.py` line 84; layer input downloads in `_sources.py` line 91)
- pyyaml >= 6.0 — `sources.yaml` parsing in `_sources.py` line 29

**Testing:**
- None detected. No `jest.config.*`, `vitest.config.*`, `pytest.ini`, `pyproject.toml`, or `*.test.*` / `*.spec.*` files exist in the repo. Verification is limited to `npm run lint` and `npm run build`.

**Build/Dev:**
- Vite (`vite`, `vite build`, `vite preview`) — npm scripts in `app/package.json` lines 8-13
- ESLint 10.2.1 with flat config at `app/eslint.config.js`; extends `js.configs.recommended`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh` (vite preset), and `eslint-config-prettier`
- Prettier 3.8.3, configured by `app/.prettierrc.json` (`semi: false`, `singleQuote: true`, `trailingComma: 'es5'`, `printWidth: 100`, `tabWidth: 2`, `arrowParens: 'always'`); ignores listed in `app/.prettierignore` (`dist`, `node_modules`, `public/data`)
- External binary: `pmtiles.exe` from <https://github.com/protomaps/go-pmtiles/releases> — invoked by `data-pipeline/python/build_pmtiles.py` via `subprocess.run` at line 234; resolved via `PMTILES_BIN` env var or `PATH` lookup in `data-pipeline/python/_sources.py` lines 47-57

## Key Dependencies

**Critical:**
- `react` / `react-dom` 19.2.5 — UI rendering
- `react-router-dom` 7.9.6 — `HashRouter`, `Routes`, `Route`, `useParams`, `useSearchParams`, `useNavigate`, `Link` (used across `app/src/App.jsx`, `app/src/pages/LLDetail.jsx`, `app/src/components/Header.jsx`)
- `i18next` + `react-i18next` — bilingual UI (EN/DE) in `app/src/i18n.js` and via `useTranslation()` hook calls
- `leaflet` + `react-leaflet` — interactive map (`MapContainer`, `TileLayer`, `GeoJSON`, `useMap`) in `app/src/components/LLMap/index.jsx`
- `pmtiles` — raster overlay layer for PMTiles tiles served from `app/public/data/pmtiles/landuse-croptypes.pmtiles`
- `geopandas` + `shapely` + `rasterio` — Python geospatial stack for `data-pipeline/python/build_pmtiles.py` and `fetch_nuts.py`

**Infrastructure:**
- `vite` + `@vitejs/plugin-react` — dev server with Fast Refresh, production bundler
- `eslint` + `prettier` — code quality; no enforcement in CI workflow (only build step runs)
- `actions/checkout@v4`, `actions/setup-node@v4`, `actions/configure-pages@v5`, `actions/upload-pages-artifact@v3`, `actions/deploy-pages@v4` — GitHub Pages deployment per `.github/workflows/deploy-pages.yml`

## Configuration

**Frontend Build:**
- `app/vite.config.js` — `base: './'` (relative paths for sub-path hosting), `outDir: app/dist`, `publicDir: app/public`, `cacheDir: app/node_modules/.vite`
- `app/index.html` — minimal HTML shell loading `/src/main.jsx`; references external font CSS from `https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap`
- `app/eslint.config.js` — flat config (ESLint 10), JSX parser options enabled, browser globals; ignores `dist` and `public/data`
- `app/.prettierrc.json` — formatting rules
- `app/.prettierignore` — `dist`, `node_modules`, `public/data`

**Pipeline:**
- `data-pipeline/sources/sources.yaml` — declarative layer registry. Currently one layer (`landuse-croptypes`) with: provider/dataset metadata, source URL, license, input path/download URL/SHA256/CRS/nodata, build target CRS (`EPSG:3857`), zoom range (6-12), tile size (512), resampling (nearest), output PMTiles path, app sync path, and 20-row categorical legend.
- `data-pipeline/requirements.txt` — Python dependencies use range specs (e.g. `>=`); Windows fallback pins documented in `data-pipeline/README.md` lines 86-94)

**Environment Variables:**
- `PMTILES_BIN` — optional absolute path to `pmtiles.exe`; consulted by `data-pipeline/python/_sources.py` `find_pmtiles_bin()` (line 48). Falls back to `shutil.which("pmtiles")`.
- No `.env` files present in the repo. `.gitignore` line 8 excludes `.env`.

**Generated Files (do not edit by hand):**
- `app/src/data/landuse_legend.js` — generated by `data-pipeline/sync.py` `generate_landuse_legend()` from `sources.yaml`
- `app/src/data/layer_sources.js` — generated by `data-pipeline/sync.py` `generate_layer_sources()` from `sources.yaml`
- Both have header comments noting their generated status (lines 1-2 of each file)

## Platform Requirements

**Development:**
- Node.js (22 in CI; locally any version compatible with Vite 8 and React 19)
- npm (lockfile committed)
- Python 3.12 (mandatory on Windows for geospatial wheels; see `data-pipeline/README.md` lines 37-49)
- For pipeline raster builds: external `pmtiles` CLI binary (Windows location convention `C:\Users\<user>\Tools\pmtiles\pmtiles.exe` per `data-pipeline/README.md` lines 174-181)
- The raw 481 MB GeoTIFF `data/croptypes_2024.tif` is gitignored (`.gitignore` line 13) and must be downloaded from <https://download.geoservice.dlr.de/CROPTYPES/files/croptypes_2024.tif> (defined in `data-pipeline/sources/sources.yaml` line 34)

**Production:**
- Static file hosting only. The app is a pure SPA built with Vite and uses `HashRouter`, so the server only needs to serve `app/dist/` plus the `app/public/data/` payload referenced by relative URLs.
- Two intended deploy targets:
  1. GitHub Pages via `.github/workflows/deploy-pages.yml` (auto-deploys on push to `main`)
  2. TYPO3 sub-path (zukunft-land.org) — `OVERVIEW.md` lines 149-240 describes the integration model; relative `base: './'` in `vite.config.js` is the enabling decision

---

*Stack analysis: 2026-04-29*
