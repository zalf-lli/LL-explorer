# LL-Explorer — Data Pipeline

Scripts that fetch, clip, and process the geodata and metadata the React app consumes.

The app (at [`../app`](../app)) reads everything from [`../data/`](../data/) (committed outputs) or `../app/public/data/` (runtime-fetched copies). Nothing in the app shells out to Python or R — pipeline runs offline, its outputs get synced, the site stays static.

## Layout

```
data-pipeline/
├── python/
│   ├── fetch_nuts.py           # Download GISCO NUTS-3, clip to 5 LLs, write GeoJSON + ll_metadata.json
│   ├── generate_metadata.py    # (Phase 4) split: build ll_metadata.json from structured inputs
│   └── build_pmtiles.py        # (Phase 4) raster → clipped → reprojected → PMTiles
├── R/
│   └── fetch_example.R         # (Phase 4) stub showing how to add an R-based source
├── sources/
│   └── sources.yaml            # (Phase 4) declarative registry of data sources
├── requirements.txt
└── README.md
```

## Quick start (Python)

```bash
cd data-pipeline
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python python/fetch_nuts.py
```

This regenerates:
- `../data/ll_metadata.json`
- `../data/nuts1_de.geojson`
- `../data/nuts3_ll.geojson`
- `../data/nuts3_ll_simplified.geojson`

## Syncing pipeline output into the app

The app loads data from `app/public/data/` at runtime. After running pipeline scripts, mirror the relevant files:

```bash
cp ../data/ll_metadata.json ../app/public/data/
cp ../data/nuts1_de.geojson ../app/public/data/
cp ../data/nuts3_ll_simplified.geojson ../app/public/data/
cp -r ../data/pmtiles/ ../app/public/data/pmtiles/   # once PMTiles are built
```

A `sync` npm script will be added in Phase 4 so the app can pull fresh data with one command.

## Adding a new data source

Phase 4 introduces a declarative source registry. Until then, add a new Python script alongside `fetch_nuts.py` and write its output under `../data/` with a descriptive filename.

R-based sources are supported symmetrically — see `R/fetch_example.R` once it lands.
