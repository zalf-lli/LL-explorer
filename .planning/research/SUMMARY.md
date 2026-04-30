# Research Summary — LL-Explorer Phase 4

## Stack

- **Python only, no new libraries**: existing geopandas+pyogrio+shapely handles GeoPackage read, clip, reproject, and GeoJSON write; add only `pytest>=8.0`
- **GeoJSON over vector tiles**: clipped BÜK output will be well under 3 MB; the existing `<GeoJSON>` pattern in react-leaflet works with zero new frontend deps; revisit only if output exceeds 3 MB after simplification
- **Avoid**: fiona, mapbox-vector-tile, geojson PyPI package, tippecanoe (for now)
- **BKG BÜK source**: a BÜK1000 Shapefile (`data/boart1000_ob_v20/`) is already in the repo and may be sufficient for MVP; BÜK200 from BGR/BKG GDZ uses `dl-de/by-2-0` license (exact attribution string required); verify URL + SHA256 before adding to `sources.yaml`

## Table Stakes

- **Per-LL chart data is the core deliverable**: identical bars for all five LLs makes the tool a demo, not a research tool; pipeline must compute real per-LL percentages
- **Mock/draft badge must be visible**: the `mock` flag exists in JSON but is never rendered; researchers expect clear "Preliminary data / Vorläufige Daten" signals
- **Chart contract must include `unit`, `source`, `generated_at`, and a `mock` flag from day one**; retrofitting is painful once both pipeline and frontend are built around the shape
- **Colors belong in the legend, not chart data**: `BarChart` should resolve colors from the legend index at render time; storing `c` in chart output couples pipeline to renderer

## Architecture Recommendations

- **File ownership is the foundational split**: `data/ll_content.json` (hand-authored, never overwritten) + pipeline output → merged by `sync.py` into `app/public/data/ll_metadata.json`; human fields win on conflict
- **`build_vector.py` is a new script, not an extension of `build_pmtiles.py`**: parallel structure, same `sources.yaml`/`_sources.py` contract, `kind: vector` routing key in `sources.yaml`
- **Chart data structure**: `{ ll_slug → layer_id → items }` keyed from the start; resolve whether this lives inside `ll_metadata.json` (one fetch) or as separate per-LL files (lazy load) before 4.3
- **`--build-all` belongs in `sync.py`**: it's the orchestrator and the only script that knows all layer kinds
- **`json.dumps(..., sort_keys=True)` everywhere** in `sync.py`; `make_valid()` immediately after every `gpd.read_file()` call

## Critical Pitfalls

1. **Pipeline overwrites hand-authored content** (4.1 CRITICAL): never write `ll_content.json` from any script; `sync.py` reads it, never writes it
2. **CRS mismatch silently produces empty clip** (4.2 HIGH): explicitly align CRS before `gdf.clip()`; assert `len(clipped) > 0` after clipping
3. **Invalid BÜK geometries crash Shapely 2.x** (4.2 HIGH): call `gdf.geometry = gdf.geometry.make_valid()` immediately after reading, unconditionally
4. **Chart contract missing LL dimension causes breaking change** (4.3 HIGH): the flat shape in current `chart_data.js` requires a full rewrite to add per-LL variation; define the correct structure before writing any pipeline chart code
5. **GeoJSON > 3 MB causes Leaflet render lag** (4.2 MEDIUM): apply `simplify(0.0005)` + `set_precision(0.0001)` before writing; warn if output exceeds 2 MB

## Open Questions

**Before Phase 4.1 starts:**
- Which keys in the current `ll_metadata.json` are pipeline-owned vs human-owned? Agree and document before writing merge logic.

**Before Phase 4.2 starts:**
- Is the BÜK1000 Shapefile already at `data/boart1000_ob_v20/` sufficient, or is BÜK200 required?
- What are the exact column names in the BÜK file? (Inspect with `pyogrio.list_layers()` + `.columns` before writing `build_vector.py`.)
- Is the BKG download URL session-authenticated, or can `ensure_input_available` auto-fetch it unattended?

**Before Phase 4.3 starts:**
- Chart data embedded in `ll_metadata.json` under a `charts` key (one fetch, atomic update) OR separate files per LL+layer (lazy load, smaller per-request payload)? Pick one before writing the contract.

## Phase Dependencies

```
4.1 (content JSON + merge)    ──┐
                                ├── parallel, no shared files
4.2a (build_vector.py + BÜK)  ──┘
          │
          └── 4.2b (--build-all in sync.py)  ──>  4.3 (chart contract + first impl)
```

4.1 and 4.2a touch entirely different files and can run simultaneously. 4.2b requires 4.2a. 4.3 can be specced in parallel with 4.2 but the first real chart implementation requires 4.2a output.
