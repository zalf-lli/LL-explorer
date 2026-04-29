# Roadmap â€” LL-Explorer Phase 4

## Phases

| # | Phase | Goal | Requirements | UI |
|---|-------|------|--------------|-----|
| 1 | LL Content System | Replace ad-hoc hardcoded LL config with a structured, hand-authored JSON merged into a single metadata file | CONTENT-01, CONTENT-02, CONTENT-03, CONTENT-04 | yes |
| 2 | BÃœK Vector Pipeline | Process the BÃœK soil shapefile through a new vector pipeline path and verify all pipeline outputs with smoke tests | PIPELINE-01, PIPELINE-02, PIPELINE-03 | no |
| 3 | Chart Data Contract | Define and plumb the per-source chart summary interface so future chart implementations have a clear, stable target | CHARTS-01, CHARTS-02 | no |

---

## Phase Details

### Phase 1: LL Content System

**Status:** Complete (2026-04-29)

**Goal:** Replace scattered, hardcoded LL display config (`ll_display.js` + values in `fetch_nuts.py`) with a single hand-authored `ll_content.json` merged by `sync.py` into the app's `ll_metadata.json`.
**Requirements:** CONTENT-01, CONTENT-02, CONTENT-03, CONTENT-04
**UI hint**: yes

**Implementation plan:**

**Wave 1**
- `01-01` - Establish `data/ll_content.json` as the single hand-authored LL source and move metadata merge logic into the pipeline

**Wave 2** *(blocked on Wave 1 completion)*
- `01-02` - Remove `app/src/data/ll_display.js`, migrate UI consumers to metadata-only reads, and render preliminary-data badges

**Cross-cutting constraints:**
- `data/ll_content.json` is the only human-authored LL content source; pipeline code may read it but must never overwrite it
- Human-authored metadata fields win on merge conflicts when producing `data/ll_metadata.json`
- `mock: true` must render a bilingual preliminary-data badge on both the landing card and LL detail header

**Success criteria:**
1. Developer edits a tagline in `data/ll_content.json`, runs `python data-pipeline/sync.py`, and the updated text appears in `app/public/data/ll_metadata.json` without touching any other file
2. `app/src/data/ll_display.js` no longer exists; `npm run build` still produces a working app with correct LL colours, icons, and names
3. An LL with `"mock": true` in `ll_content.json` shows a bilingual "Preliminary data / Vorläufige Daten" badge in both the landing card and the detail page header

---

### Phase 2: BÃœK Vector Pipeline

**Goal:** Process the existing BÃœK1000 soil shapefile through a new `build_vector.py` script, producing per-LL GeoJSON outputs, and add `pytest` smoke tests covering both raster and vector pipeline outputs.
**Requirements:** PIPELINE-01, PIPELINE-02, PIPELINE-03
**UI hint**: no

**Success criteria:**
1. Running `python data-pipeline/python/build_vector.py --layer buek` produces one GeoJSON file per LL in `data/geojson/` with correct CRS (EPSG:4326), non-empty features, and a build log line reporting output file size
2. Running `python -m pytest data-pipeline/tests/` passes all smoke tests, verifying PMTiles output (existing layer) and GeoJSON outputs (new BÃœK layer) without re-running the full build
3. The script aborts with a clear error message (not a silent empty file) if CRS misalignment or invalid geometries are detected

---

### Phase 3: Chart Data Contract

**Goal:** Document the chart output JSON schema and add optional `chart:` stanza support to `sources.yaml` + `sync.py` so any layer can declare a chart script and have its output copied to `app/public/data/charts/`.
**Requirements:** CHARTS-01, CHARTS-02
**UI hint**: no

**Success criteria:**
1. The chart JSON schema is documented (shape, field names, types, bilingual label convention) in a location a future implementer can find without reading source code
2. A `sources.yaml` entry with a `chart:` stanza passes `sync.py` without errors; `sync.py` logs a `[chart]` line and copies the output file if it exists, or logs `[chart] skipped â€” not yet built` if it doesn't
3. The crop-types layer (existing) can be given a `chart:` stanza as a dry-run validation without writing any chart computation code

---

## Requirement Traceability

| Requirement | Phase | Phase Name |
|-------------|-------|------------|
| CONTENT-01  | 1     | LL Content System |
| CONTENT-02  | 1     | LL Content System |
| CONTENT-03  | 1     | LL Content System |
| CONTENT-04  | 1     | LL Content System |
| PIPELINE-01 | 2     | BÃœK Vector Pipeline |
| PIPELINE-02 | 2     | BÃœK Vector Pipeline |
| PIPELINE-03 | 2     | BÃœK Vector Pipeline |
| CHARTS-01   | 3     | Chart Data Contract |
| CHARTS-02   | 3     | Chart Data Contract |

---

*Created: 2026-04-29*
