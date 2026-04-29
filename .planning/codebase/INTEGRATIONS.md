# External Integrations

**Analysis Date:** 2026-04-29

## APIs & External Services

**Geospatial data sources (consumed by the offline Python pipeline, never by the browser):**

- **GISCO (Eurostat) NUTS3 boundaries**
  - Used for: Downloading 2021 NUTS-3 polygons, filtering to Germany, tagging the 5 Living Labs
  - Endpoint: `https://gisco-services.ec.europa.eu/distribution/v2/nuts/geojson/NUTS_RG_01M_2021_4326_LEVL_3.geojson`
  - Client: `requests`
  - Auth: None (public dataset)
  - Caching: Local cache at `data/_cache/nuts3_2021_de.geojson` (gitignored)

- **DLR EOC Geoservice — CROPTYPES_DE_P1Y (2024)**
  - Used for: Source raster for the `landuse-croptypes` PMTiles layer
  - Download URL: `https://download.geoservice.dlr.de/CROPTYPES/files/croptypes_2024.tif`
  - Dataset page: `https://geoservice.dlr.de/web/datasets/croptypes_de`
  - STAC endpoint: `https://geoservice.dlr.de/eoc/ogc/stac/v1/collections/CROPTYPES_DE_P1Y` (declared in `sources.yaml` but not yet automated)
  - Client: `requests` via streaming download in `data-pipeline/python/_sources.py` `_download()`
  - Auth: None (CC-BY-4.0)
  - Optional integrity check: SHA-256 in `sources.yaml` (currently `null`); validated in `_sources.py` `ensure_input_available()` when set

**Browser-side tile services (loaded at runtime by Leaflet):**

- **CARTO Voyager basemap** (`https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png`)
  - Used for: Background map tiles in the LL detail map
  - Wired in: `app/src/components/LLMap/index.jsx` line 332 (`<TileLayer />`)
  - Subdomains: `a`, `b`, `c`, `d` (line 16)
  - Attribution metadata: `BASEMAP_SOURCE` constant in `app/src/components/LLMap/index.jsx` lines 19-24, surfaced via the in-map "i" info button (`MapInfoControl` at lines 162-277)
  - License: ODbL / CC BY 3.0 (OpenStreetMap contributors)

- **Fontshare CDN** (`https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap`)
  - Used for: Loading the Satoshi web font referenced by `FONT` token in `app/src/theme.js` line 46
  - Wired in: `app/index.html` lines 7-10 (`<link rel="stylesheet">`)
  - Auth: None

**Documented but not yet integrated** (see `docs/data-sources.md`):

- **DLR Croptypes STAC** — listed but no automated STAC client; the pipeline currently uses the direct `download_url` instead.
- **Eurostat / European Commission "Degree of Urbanisation"** — listed in `docs/data-sources.md` line 3; no fetcher implemented.
- **Harmonized IACS inventory of Europe (Zenodo)** — `https://zenodo.org/records/18670815` (`docs/data-sources.md` line 5); no fetcher implemented.
- **Destatis GENESIS-Online API** — `https://www-genesis.destatis.de/datenbank/online` (`docs/data-sources.md` line 7); requires an API token. Token NOT yet stored in the repo. The user note in `docs/data-sources.md` line 8 explicitly flags the need to store it safely once integration starts.

## Data Storage

**Databases:**
- None. The application is a fully static SPA; there is no relational or document database, no ORM, and no server.
- One transient SQLite usage exists inside the offline pipeline: `data-pipeline/python/build_pmtiles.py` lines 175-227 writes an MBTiles file (which is a SQLite database with a `tiles` and `metadata` table) into `data/_cache/<layer>-<tmp>/<layer>.mbtiles` before converting to PMTiles. The MBTiles is deleted after conversion; the PMTiles file is the persistent artifact.

**File Storage:**
- Local filesystem only. Persistent geodata artifacts live under `data/` (committed) and `app/public/data/` (runtime-fetched copy synced from `data/`).
- Synced into `app/public/data/` (runtime reads):
  - `app/public/data/ll_metadata.json` (~16 KB)
  - `app/public/data/ll_boundaries.geojson` (~129 KB)
  - `app/public/data/nuts1_de.geojson` (~31 KB)
  - `app/public/data/nuts3_ll.geojson` (~167 KB)
  - `app/public/data/nuts3_ll_simplified.geojson` (~67 KB)
  - `app/public/data/pmtiles/landuse-croptypes.pmtiles` (~35.9 MB committed)
- Committed under `data/` but not currently synced into `app/public/data/`:
  - `data/NUTS_RG_60M_2024_4326_LEVL_1.geojson` (~233 KB)
- Excluded from git (`.gitignore` lines 12-15):
  - `data/_cache/` (transient pipeline cache)
  - `data/croptypes_2024.tif` (~481 MB raw raster)
  - `data/boart1000_ob_v20` (raw soil data)
  - `data/pmtiles/*.tmp`
- Sync mechanism: `data-pipeline/sync.py` `sync_to_app()` copies the static GeoJSON/JSON files plus all `output.sync_to` PMTiles into `app/public/data/`, then regenerates `app/src/data/landuse_legend.js` and `app/src/data/layer_sources.js`.

**Caching:**
- In-memory only:
  - GeoJSON fetch cache: `Map`/`Map` of in-flight promises and resolved data in `app/src/hooks/useGeoJSON.js` lines 3-25
  - LL metadata cache: module-scope `cache` and `inflight` variables in `app/src/hooks/useLLMetadata.js` lines 5-24
  - PMTiles archive cache: `PMTILES_CACHE` module-scope `Map` in `app/src/components/LLMap/index.jsx` lines 17, 33-38

## Authentication & Identity

**Auth Provider:**
- None. The app is a public, static, read-only site with no login, sessions, or user accounts. Confirmed in `PROJECT-STATUS.md` line 204 ("Authentication — static public site").

## Monitoring & Observability

**Error Tracking:**
- None. No Sentry, Bugsnag, Rollbar, etc. integrations.
- Frontend error surfaces:
  - `ErrorBanner` component in `app/src/App.jsx` lines 44-54 — visible UI for metadata-load failures
  - `console` warnings via `console.error` not used; component-level error states are displayed inline (e.g., `app/src/components/LLMap/index.jsx` lines 307-316)
  - i18next error translations for map load failures: `map.loadError` keys in `app/src/i18n.js` lines 136, 288

**Logs:**
- Pipeline scripts use `print()` with `[tag]` prefixes (`[fetch]`, `[cache]`, `[ok]`, `[warn]`, `[skip]`, `[run]`, `[input]`, `[download]`). No structured logging library.
- No application-side logging beyond browser-default `console`.

**Analytics:**
- None detected. No Google Analytics, Plausible, Matomo, or similar scripts in `app/index.html` or `app/src/`.

## CI/CD & Deployment

**Hosting:**
- **Primary (current):** GitHub Pages — workflow `.github/workflows/deploy-pages.yml`
  - Triggers: push to `main` branch (line 6) and `workflow_dispatch` (line 7)
  - Build: Node 22, `npm ci` then `npm run build` inside `app/` (lines 27-39)
  - Artifact: `app/dist/` uploaded via `actions/upload-pages-artifact@v3`
  - Deploy: `actions/deploy-pages@v4` to the `github-pages` environment
  - Permissions: `contents: read`, `pages: write`, `id-token: write`
  - Concurrency: `github-pages` group, `cancel-in-progress: true`
  - Expected URL: `https://<owner>.github.io/LL-explorer/` (`README.md` line 83)

- **Secondary (planned):** TYPO3 sub-path on zukunft-land.org
  - Strategy documented in `OVERVIEW.md` lines 149-240
  - `vite.config.js` line 11 sets `base: './'` (relative paths) so the build works from any sub-path
  - `HashRouter` (`app/src/App.jsx` line 25) means the server never needs to handle SPA route fallbacks
  - Deploy model: copy `app/dist/` plus `app/public/data/` into a TYPO3 asset folder; mount the React root in a TYPO3 page

**CI Pipeline:**
- One GitHub Actions workflow only (`deploy-pages.yml`). It does NOT run `npm run lint`, type checks, or tests — only `npm ci` + `npm run build`. Test/lint enforcement is on the developer's machine.

## Environment Configuration

**Required env vars:**
- `PMTILES_BIN` (Python pipeline only, optional)
  - Absolute path to the `pmtiles.exe` (or `pmtiles`) binary
  - Consulted by `data-pipeline/python/_sources.py` `find_pmtiles_bin()`
  - If unset, the script tries `shutil.which("pmtiles")` and raises `RuntimeError` if not found
  - Recommended Windows value: `C:\Users\<user>\Tools\pmtiles\pmtiles.exe`

**No frontend env vars.** Vite's `import.meta.env.*` is not used anywhere in `app/src/`. There are no `VITE_*` variables, no runtime feature flags, and no API keys baked into the build.

**Secrets location:**
- No secrets currently managed by this repo. The only known future secret is the Destatis GENESIS API token, which is documented in `docs/data-sources.md` line 8 as a TODO. There is no `.env` file in the repo (`.gitignore` line 8 already covers it).

## Webhooks & Callbacks

**Incoming:**
- None. Static site with no backend.

**Outgoing:**
- None. The pipeline performs one-shot HTTP downloads (GISCO NUTS, DLR croptypes raster) and never POSTs.

## External Binaries Invoked

**`pmtiles` (go-pmtiles) CLI:**
- Used by: `data-pipeline/python/build_pmtiles.py` (`subprocess.run([find_pmtiles_bin(), "convert", ...])`)
- Purpose: Convert MBTiles → PMTiles in the `convert_pmtiles()` function
- Source: `https://github.com/protomaps/go-pmtiles/releases`
- Discovery: `data-pipeline/python/_sources.py` `find_pmtiles_bin()`

**`rio` (rasterio CLI):**
- Discovered by: `data-pipeline/python/_sources.py` `find_rio_bin()`
- Currently imported but not invoked by the active build pipeline (`build_pmtiles.py` uses the rasterio Python API directly). The helper exists for future fallback paths.

---

*Integration audit: 2026-04-29*
