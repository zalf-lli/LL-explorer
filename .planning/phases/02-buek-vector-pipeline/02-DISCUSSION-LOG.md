# Phase 2: BÜK Vector Pipeline — Discussion Log

**Date:** 2026-04-30
**Areas discussed:** Input format, GeoJSON output fields, sync.py scope, Smoke test approach

---

## Pre-discussion user input

The user redirected from BÜK1000 (`data/boart1000_ob_v20/`) to BÜK250 (`data/buek250_mgm_utm_v60/buek250_mgm_utm_v60.gpkg`), citing it as more suitable. Asked whether GeoPackage or Shapefile is more robust for the pipeline.

User also asked: "For the raster based data we are outputting a PMTiles file that covers all LL, but for GeoJSON I assume it is easier to output per LL files but will they all be shown on the map simultaneously?"

**Clarification provided:** PMTiles only fetches tiles in viewport — one file for all LLs is fine for raster. GeoJSON has no viewport culling — Leaflet loads the full file. Since the app shows one LL at a time, per-LL GeoJSON files are the correct approach (5× smaller payload per load).

---

## Area 1: Input format

**Question:** Read BÜK250 GPKG directly, or export a Shapefile first?

| Option | Description |
|--------|-------------|
| Read GPKG directly ✓ | Single file, no field name limits, pyogrio/geopandas reads natively |
| Export Shapefile first | Adds manual step, no benefit for this data |

**Decision:** Read GPKG directly.

---

## Area 2: GeoJSON output fields

**Question 1:** Which BÜK250 attributes to include in output GeoJSON?

| Option | Description |
|--------|-------------|
| SYM_NR + GEN_ID + BEMERKUNG ✓ | Color code + soil DB key + special-area flag |
| SYM_NR only | Minimal, can add more later |
| All fields as-is | Over-inclusive, bloats files |

**Decision:** SYM_NR + GEN_ID + BEMERKUNG.

**Question 2:** Per-LL file naming pattern?

| Option | Description |
|--------|-------------|
| data/geojson/buek250-{slug}.geojson ✓ | Layer prefix avoids collisions with future vector layers |
| data/geojson/{slug}/buek250.geojson | Slug-first directory structure |

**Decision:** `data/geojson/buek250-{slug}.geojson`.

---

## Area 3: sync.py scope

**Question 1:** Should sync.py be updated to copy GeoJSON → app/public/data/geojson/ in Phase 2?

| Option | Description |
|--------|-------------|
| Defer to UI phase ✓ | Phase 2 has no frontend changes; nothing reads the files yet |
| Add to sync.py now | Completes pipeline contract but copies files nothing uses |
| Add sync_to field only | Declares intent, defers implementation |

**Decision:** Defer sync.py changes. GeoJSON stays in `data/geojson/` for Phase 2.

**Question 2:** Should sources.yaml declare `clip_to` explicitly for the vector entry?

| Option | Description |
|--------|-------------|
| Inherit defaults.clip_to ✓ | Clip boundary is handled by per-LL loop, not a YAML config |
| Declare explicitly | Verbose; clip semantics differ between raster and vector |

**Decision:** Inherit defaults.

---

## Area 4: Smoke test approach

**Question 1:** How should tests verify outputs without re-running the full build?

| Option | Description |
|--------|-------------|
| Commit pre-built outputs ✓ | Run build once, commit 5 GeoJSON files, tests assert against them |
| Synthetic conftest fixtures | Tests pipeline logic but more setup; not aligned with requirement wording |
| Skip-if-missing strategy | Only runs in environments with a prior build |

**Decision:** Commit pre-built per-LL GeoJSON files; tests check file existence, CRS=EPSG:4326, feature count > 0.

**Question 2:** How should the PMTiles smoke test work?

| Option | Description |
|--------|-------------|
| Use already-committed PMTiles ✓ | landuse-croptypes.pmtiles is already in the repo |
| Test PMTiles separately | Adds format-level validation complexity |

**Decision:** Check committed PMTiles file: exists + non-zero byte size.

---

## Deferred Ideas

- sync.py copy step for GeoJSON — deferred to UI/frontend phase
- Leaflet rendering with SYM_NR style function — deferred to UI phase
- BÜK legend JS generation — deferred to UI phase
- `--all` flag for batch rebuilds — v2 requirement
- BÜK1000 data at `data/boart1000_ob_v20/` — not used; BÜK250 is the chosen source
