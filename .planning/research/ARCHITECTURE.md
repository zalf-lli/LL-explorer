# Architecture Research
<!-- Phase 4 milestone — researched 2026-04-29 -->

## Content JSON Merge Pattern

### The problem

`ll_metadata.json` is currently written entirely by `fetch_nuts.py`. It carries three categories of data that have different ownership:

| Category | Current home | Owner |
|----------|-------------|-------|
| NUTS-3 codes, derived geometry | `fetch_nuts.py` (computed) | Pipeline |
| Names, taglines, contact | `LL_DEFINITIONS` dict in `fetch_nuts.py` (hard-coded) | Researcher |
| Colours, KPI values, display order | `ll_display.js` (hard-coded) | Researcher |
| KPI values | `ll_display.js` (placeholder) | Pipeline (future) |

The Phase 4.1 goal is to put researcher-owned content into a hand-authored file that survives pipeline re-runs, and to have `sync.py` produce the merged output rather than `fetch_nuts.py`.

### Recommended file structure

**New hand-authored file:** `data/ll_content.json`

```json
{
  "east-brandenburg": {
    "num": "01",
    "color": "#9bc72d",
    "colorDark": "#5e781b",
    "outline": "#eb5b25",
    "region": { "en": "Brandenburg", "de": "Brandenburg" },
    "en": {
      "name": "East Brandenburg",
      "tagline": "Multifunctional and diverse arable farming systems",
      "description": "..."
    },
    "de": {
      "name": "Ost-Brandenburg",
      "tagline": "Multifunktionale und vielfältige Ackerbausysteme",
      "description": "..."
    }
  },
  ...
}
```

Rules for this file:
- Keyed by `ll_slug` — same identifier used by pipeline and frontend.
- Carries display-only fields (`num`, `color`, `colorDark`, `outline`, `region`) that are not computable from geometry.
- Carries bilingual name/tagline/description in an `en`/`de` structure parallel to what `ll_metadata.json` already uses.
- Does NOT carry NUTS-3 codes, dissolved geometry, or any computed statistic — those remain pipeline-generated.
- Lives in `data/` alongside other committed outputs; it is hand-edited, never overwritten by any script.

**Existing pipeline output (unchanged shape):** `data/ll_metadata.json`

`fetch_nuts.py` continues to write this file but strips out the content that moves to `ll_content.json`. Concretely, the `LL_DEFINITIONS` dict in `fetch_nuts.py` retains only `nuts3` codes; names and taglines are removed from the Python source.

**Final merged output (written by `sync.py`):** `app/public/data/ll_metadata.json`

This is what the browser fetches. The file in `data/ll_metadata.json` becomes an intermediate, not the app-facing file.

### Merge logic in sync.py

Add a `merge_ll_metadata()` function:

```python
def merge_ll_metadata() -> None:
    content_path = resolve("data/ll_content.json")
    pipeline_path = resolve("data/ll_metadata.json")
    out_path = resolve("app/public/data/ll_metadata.json")

    with content_path.open(encoding="utf-8") as f:
        content = json.load(f)
    with pipeline_path.open(encoding="utf-8") as f:
        pipeline = json.load(f)

    merged = {}
    for slug in pipeline:
        base = dict(pipeline[slug])       # nuts3, contact, mock, en, de (names/factsheets)
        display = content.get(slug, {})   # num, color, outline, region, en/de overrides
        # Display content fields override pipeline stubs
        for lang in ("en", "de"):
            if lang in display:
                base[lang] = {**base.get(lang, {}), **display[lang]}
        # Top-level display fields merged in
        for key in ("num", "color", "colorDark", "outline", "region"):
            if key in display:
                base[key] = display[key]
        merged[slug] = base

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(merged, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[sync] merged ll_metadata.json -> {out_path.relative_to(repo_root())}")
```

The merge strategy is: pipeline data is the base, content JSON fields overwrite. This means a re-run of `fetch_nuts.py` never loses researcher-authored text.

### Changes to sync_to_app()

Replace the naive copy of `data/ll_metadata.json` in `STATIC_DATA_FILES` with a call to `merge_ll_metadata()`. The other four static files (`nuts1_de.geojson`, `nuts3_ll.geojson`, etc.) stay as plain copies.

```python
def sync_to_app() -> None:
    for rel_path in STATIC_DATA_FILES:           # ll_metadata.json removed from this list
        source = resolve(rel_path)
        sync_file(source, resolve(f"app/public/{rel_path}"))
    merge_ll_metadata()                          # replaces the simple copy
    sync_pmtiles()
    generate_landuse_legend()
    generate_layer_sources()
```

### Frontend changes

`useLLMetadata.js` currently imports `LL_DISPLAY`, `LL_ORDER`, and `LL_REGION` from `ll_display.js` and merges them in `buildLL()`. Once `ll_metadata.json` carries `num`, `color`, `colorDark`, `outline`, and `region` directly, that import can be removed entirely. The `buildLL()` function reads those fields from `raw` instead of `display`.

`ll_display.js` is then deleted. `LL_ORDER` becomes either a hardcoded constant in `useLLMetadata.js` (simple, low risk) or a field in `ll_content.json` (preferred, keeps order researcher-controlled).

Add `display_order` as an integer to each LL in `ll_content.json`:

```json
"east-brandenburg": { "display_order": 1, ... }
```

`sync.py` emits an `ll_order` array in the merged output so the frontend can sort by it without hardcoding slugs in JS.

### Data flow (4.1)

```
data/ll_content.json  (hand-authored, never overwritten)
         +
data/ll_metadata.json  (fetch_nuts.py output: nuts3, dissolved geom references, factsheets)
         |
         v  sync.py merge_ll_metadata()
app/public/data/ll_metadata.json  (browser-fetched, complete)
         |
         v  useLLMetadata.js fetch()
React components (LL cards, detail page, badge colours)
```

---

## Vector Source Routing

### The choice: new script vs extended existing

**Recommendation: a new `build_vector.py` script.**

The case against extending `build_pmtiles.py`:
- `build_pmtiles.py` is structurally about raster operations: `rasterio.open()`, tile walking, `mercantile`, RGBA array construction, MBTiles SQLite. None of these are applicable to a vector workflow.
- The `kind: raster` field already exists in `sources.yaml`. Adding vector processing inside the same file would require large conditional branches (`if layer["kind"] == "vector": ...`) that grow alongside each new format. The file would accumulate mixed concerns.
- The external CLI dependency graph diverges: raster needs `pmtiles` + `rio`; vector needs only `pmtiles` (for MVT conversion) or just `ogr2ogr`/geopandas depending on output format.

The case against a single generic `build_geojson.py` with no PMTiles path:
- BKG BÜK is a polygon source with up to ~100k features Germany-wide. Serving raw GeoJSON at detail-page zoom is expensive in bandwidth and rendering. Clipping + attribute-filtering to LL extent then writing a compact GeoJSON is the right MVP, but the architecture should leave room for vector PMTiles (MVT) later.
- Naming it `build_geojson.py` precludes that extension without renaming.

**The right abstraction: `build_vector.py`**

This script mirrors the interface of `build_pmtiles.py`:

```
python python/build_vector.py --layer soil-buek
```

Internally it does:
1. `ensure_input_available(layer)` — same helper from `_sources.py`.
2. Read vector input with geopandas (`gpd.read_file()`).
3. Clip to LL boundaries + buffer using the same `clip_to` / `clip_buffer_m` pattern already in `build_clip_geometry()`.
4. Filter, rename, or recode attributes as declared in a `build:` stanza.
5. Write clipped GeoJSON to the declared `output.geojson` path.
6. Optionally compute summary statistics (area per class, etc.) and write `output.chart_json`.

The script stays close to geopandas/shapely operations — do not add a higher-level "layer system" abstraction. Rationale: there are currently two build scripts; abstracting them into a shared base class is premature generalization until at least a third source type appears. The `sources.yaml` + `_sources.py` pair is the abstraction layer; the build scripts are the leaf implementations.

### sources.yaml additions for vector layers

```yaml
  - id: soil-buek
    app_layer: soil
    kind: vector
    title:
      en: "Soil types (BKG BÜK200)"
      de: "Bodentypen (BKG BÜK200)"
    source:
      provider: "Bundesamt für Kartographie und Geodäsie (BKG)"
      dataset: "BÜK200"
      license: "dl-de/by-2-0"
      attribution: "(c) BKG 2023, dl-de/by-2-0"
    input:
      path: data/buek200.gpkg          # or .shp — TBD when access method confirmed
      download_url: null
      sha256: null
      crs: "EPSG:25832"
    build:
      script: python/build_vector.py
      target_crs: "EPSG:4326"          # GeoJSON must be WGS84
      clip_to: data/nuts3_ll.geojson
      clip_buffer_m: 500
      attribute_keep:                   # columns to retain in output
        - RS                           # soil class code
        - LEG_TEXT                     # German legend label
      attribute_map:                   # rename for frontend clarity
        RS: soil_code
        LEG_TEXT: label_de
    output:
      geojson: data/vector/soil-buek.geojson
      sync_to: app/public/data/vector/soil-buek.geojson
      chart_json: data/charts/soil-buek-{slug}.json   # one per LL, see 4.3
```

Key design decisions in this schema:
- `kind: vector` is the routing key. `sync.py` and `build_vector.py` branch on this.
- `build.attribute_keep` and `build.attribute_map` are declarative attribute surgery — no custom Python needed for simple rename/filter.
- `output.geojson` follows the same `data/` convention as PMTiles outputs.
- `output.sync_to` allows `sync.py` to copy the file using its existing `sync_file()` function with zero new logic for the copy step.

### sync.py changes for vector output

`sync_pmtiles()` has the right structure to copy declared output files. Add a parallel `sync_vector()`:

```python
def sync_vector() -> None:
    sources = load_sources()
    for layer in sources["layers"]:
        if layer.get("kind") != "vector":
            continue
        output = layer.get("output", {})
        geojson_path = output.get("geojson")
        sync_target = output.get("sync_to")
        if not geojson_path or not sync_target:
            continue
        source = resolve(geojson_path)
        if not source.exists():
            print(f"[skip] missing {source.relative_to(repo_root())}")
            continue
        sync_file(source, resolve(sync_target))
```

### build_vector.py skeleton

```python
# data-pipeline/python/build_vector.py
from __future__ import annotations

import argparse
import json
from pathlib import Path

import geopandas as gpd

from _sources import ensure_input_available, get_layer, load_sources, repo_root, resolve


def clip_to_ll(gdf: gpd.GeoDataFrame, layer: dict) -> gpd.GeoDataFrame:
    build_cfg = layer.get("build", {})
    clip_path = resolve(build_cfg.get("clip_to", layer["defaults"]["clip_to"]))
    buffer_m = build_cfg.get("clip_buffer_m", layer["defaults"].get("clip_buffer_m", 0))
    clip_gdf = gpd.read_file(clip_path).to_crs(gdf.crs)
    if buffer_m:
        clip_gdf = clip_gdf.to_crs("EPSG:3857")
        clip_gdf.geometry = clip_gdf.geometry.buffer(buffer_m)
        clip_gdf = clip_gdf.to_crs(gdf.crs)
    return gpd.clip(gdf, clip_gdf)


def apply_attribute_surgery(gdf: gpd.GeoDataFrame, layer: dict) -> gpd.GeoDataFrame:
    build_cfg = layer.get("build", {})
    keep = build_cfg.get("attribute_keep")
    rename = build_cfg.get("attribute_map", {})
    if keep:
        cols = [c for c in keep if c in gdf.columns] + ["geometry"]
        gdf = gdf[cols]
    if rename:
        gdf = gdf.rename(columns=rename)
    return gdf


def build_layer(layer_id: str) -> None:
    layer = get_layer(layer_id)
    input_path = ensure_input_available(layer)

    build_cfg = layer.get("build", {})
    target_crs = build_cfg.get("target_crs", "EPSG:4326")

    print(f"[run] reading {input_path.relative_to(repo_root())}")
    gdf = gpd.read_file(input_path)
    print(f"[ok] loaded {len(gdf)} features, CRS={gdf.crs}")

    gdf = clip_to_ll(gdf, layer)
    print(f"[ok] clipped to {len(gdf)} features")

    gdf = apply_attribute_surgery(gdf, layer)
    gdf = gdf.to_crs(target_crs)

    out_path = resolve(layer["output"]["geojson"])
    out_path.parent.mkdir(parents=True, exist_ok=True)
    gdf.to_file(out_path, driver="GeoJSON")
    size_kb = out_path.stat().st_size / 1024
    print(f"[ok] wrote {out_path.relative_to(repo_root())} ({size_kb:.0f} KB)")
```

### Abstraction level

Stay at geopandas/shapely. The two reasons:

1. **The pipeline has one vector source so far.** BKG BÜK is structurally simple: read, clip, rename, write. Any abstraction beyond what `attribute_keep`/`attribute_map` provides will be invented ahead of demand.
2. **The existing pattern sets the contract.** `build_pmtiles.py` is a ~300-line script that does one job with direct geopandas/rasterio calls and no wrapper framework. `build_vector.py` should be the same length and shape.

When a second vector source appears with different processing requirements, extract shared helpers into `_sources.py` or a new `_vector.py` module — do not pre-build that module now.

---

## Chart Data Contract

### The problem

Each source layer produces spatially distributed data. The frontend chart components (currently `BarChart.jsx` rendering placeholders) need per-LL aggregated summaries — for example, percentage of area by crop type or soil class within each LL boundary. The aggregation logic is specific to each source; no generic function exists.

Phase 4.3 defines the interface, not the implementation. The contract has three parts: sources.yaml declaration, output JSON schema, and frontend consumption pattern.

### sources.yaml declaration

Each layer that supports a chart summary declares an optional `chart` block:

```yaml
    chart:
      script: python/charts/chart_croptypes.py    # path relative to data-pipeline/
      per_ll: true                                  # emit one JSON per LL slug
      output_pattern: data/charts/{layer_id}-{slug}.json
```

- `script` is a standalone Python script invoked by `sync.py` (or a future `build_all.py`). It is not called by `build_pmtiles.py` or `build_vector.py` — chart generation is a separate step that may require the final output file.
- `per_ll: true` means the script writes one JSON per slug. `per_ll: false` (or absent) means a single aggregate file.
- `output_pattern` is expanded with `layer_id` and `slug` by the sync step. The resolved paths are copied to `app/public/data/charts/`.

### Output JSON schema

Every chart JSON has the same envelope regardless of source:

```json
{
  "layer_id": "landuse-croptypes",
  "ll_slug": "east-brandenburg",
  "generated": "2026-04-29T00:00:00Z",
  "chart_type": "area_breakdown",
  "unit": "ha",
  "series": [
    { "key": "11", "label": { "en": "winter wheat", "de": "Winterweizen" }, "color": "#c2e077", "value": 12400.5 },
    { "key": "12", "label": { "en": "winter barley", "de": "Wintergerste" }, "color": "#9bc72d", "value": 8300.0 }
  ]
}
```

Schema rules:
- `layer_id` + `ll_slug` uniquely identify the file; they are also in the filename.
- `generated` is an ISO-8601 timestamp for cache-busting / staleness detection.
- `chart_type` is a controlled vocabulary (`area_breakdown`, `count_breakdown`, `time_series`). The React chart component switches on this field.
- `unit` is a display string passed through to the axis label.
- `series` is an ordered array of `{ key, label, color, value }` objects. `key` matches the legend value from sources.yaml where applicable (enables legend-chart colour consistency). `label` is bilingual.
- Unknown additional fields are allowed — they are ignored by the generic renderer.

### Frontend consumption

Add a `useChartData(layerId, slug)` hook in `app/src/hooks/useChartData.js`:

```javascript
// Fetches ./data/charts/{layerId}-{slug}.json — returns { data, loading, error }
// Uses the same module-cache pattern as useGeoJSON.
const cache = new Map()
export function useChartData(layerId, slug) { ... }
```

The `BarChart.jsx` component receives the `series` array and renders it. Bilingual labels are picked via the same `lang` pattern used throughout the app.

Chart JSON files are copied to `app/public/data/charts/` by `sync.py` — they are fetched at runtime, not bundled, keeping them out of the JS bundle.

### Chart script interface

A chart script is a standalone Python CLI:

```
python data-pipeline/python/charts/chart_croptypes.py --layer landuse-croptypes --slug east-brandenburg
```

It reads whatever pipeline output it needs (the PMTiles file cannot be read in Python; it would read the intermediate `data/_cache/*.tif` or the original raster), writes the output JSON, and exits with 0 on success.

`sync.py` is responsible for invoking chart scripts after the corresponding build artifacts exist. The invocation is optional: if a `chart.script` is declared, run it; if not, skip.

---

## Build Order Implications

### Phase dependency graph

```
fetch_nuts.py
    |
    v
data/ll_metadata.json         (nuts3, dissolved boundaries, factsheet stubs)
data/ll_boundaries.geojson
data/nuts3_ll.geojson
    |
    |    data/ll_content.json  (hand-authored, no upstream dependency)
    |          |
    v          v
sync.py  merge_ll_metadata()
    |
    v
app/public/data/ll_metadata.json   (browser-fetched)


build_pmtiles.py --layer landuse-croptypes
    |
    v
data/pmtiles/landuse-croptypes.pmtiles
    |
    (chart_croptypes.py reads source raster, not pmtiles)
    |
    v
data/charts/landuse-croptypes-{slug}.json


build_vector.py --layer soil-buek
    |
    v
data/vector/soil-buek.geojson
    |
    v
python/charts/chart_buek.py --layer soil-buek --slug {slug}
    |
    v
data/charts/soil-buek-{slug}.json


sync.py sync_to_app()
    reads: data/ll_content.json + data/ll_metadata.json
    reads: data/pmtiles/*.pmtiles
    reads: data/vector/*.geojson
    reads: data/charts/*.json
    reads: sources.yaml (for legend + layer_sources codegen)
    writes: app/public/data/**
    writes: app/src/data/landuse_legend.js
    writes: app/src/data/layer_sources.js
```

### Hard ordering constraints

1. `fetch_nuts.py` must run before `sync.py` (produces `data/ll_metadata.json`).
2. `build_pmtiles.py` or `build_vector.py` must run before their respective chart scripts (chart scripts read build outputs).
3. `sync.py` must run last — it reads all prior outputs.
4. `data/ll_content.json` has no upstream dependency; it can be created at any time and is not overwritten by any script.

### --all flag design (4.2)

The `--all` flag does not belong in `build_pmtiles.py` because it is no longer the only build script. It belongs in `sync.py`, making the orchestrator more explicit:

```
python data-pipeline/sync.py --build-all
```

Execution sequence inside `sync.py --build-all`:

```python
def build_all() -> None:
    sources = load_sources()
    for layer in sources["layers"]:
        kind = layer.get("kind", "raster")
        layer_id = layer["id"]
        if kind == "raster":
            # invoke build_pmtiles.py --layer {id} as subprocess, or import and call directly
            build_raster_layer(layer_id)
        elif kind == "vector":
            build_vector_layer(layer_id)
        # after layer build, run chart script if declared
        if layer.get("chart", {}).get("script"):
            run_chart_script(layer)
    sync_to_app()
```

Alternatively, keep `--all` as a flag in each build script and have `sync.py` delegate. The `sync.py`-owned flag is preferable because it avoids subprocess nesting and keeps the routing logic in one place.

### Phase 4.3 isolation

The chart contract (4.3) has no blocking dependency on vector sources (4.2). The contract can be defined and a first implementation written for the raster croptypes layer independently of BÜK. Recommended order:

1. 4.1: Implement content JSON + merge in sync.py. Eliminates `ll_display.js`.
2. 4.2a: Add `build_vector.py`, register `soil-buek` in sources.yaml, implement smoke tests.
3. 4.2b: Add `--build-all` to sync.py routing.
4. 4.3: Implement chart contract using the croptypes layer as the first real example; stub the BÜK chart script.

This ordering means 4.1 and 4.2a can be developed in parallel if needed — they touch different files (`sync.py` + `ll_content.json` vs `build_vector.py` + `sources.yaml`).

### Component boundary summary

| Component | Reads | Writes | Can run without |
|-----------|-------|--------|-----------------|
| `fetch_nuts.py` | GISCO API, `LL_DEFINITIONS` (in-script) | `data/ll_metadata.json`, `data/*.geojson` | nothing |
| `data/ll_content.json` | (hand-authored) | n/a | n/a |
| `build_pmtiles.py` | `sources.yaml`, raster tif | `data/pmtiles/*.pmtiles` | `fetch_nuts.py` output (only for clip geometry) |
| `build_vector.py` | `sources.yaml`, vector gpkg/shp | `data/vector/*.geojson` | `fetch_nuts.py` output (clip geometry) |
| `charts/chart_*.py` | build outputs, `sources.yaml` | `data/charts/*.json` | corresponding build script |
| `sync.py` | everything in `data/`, `sources.yaml`, `ll_content.json` | `app/public/data/**`, `app/src/data/*.js` | all prior steps |
