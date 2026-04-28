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

## What this folder is for

The pipeline is a small set of offline preparation tools. You run them yourself in a terminal when you want to:

- rebuild the Living Lab boundary and metadata files
- build thematic PMTiles layers from source rasters
- copy fresh outputs into the React app

Nothing here runs automatically in the browser. Think of it as a preparation step before viewing or deploying the app.

## Recommended setup for Windows users

If you are not very comfortable with Python environments, use the exact sequence below.

### 1. Check that Python 3.12 is installed

Open PowerShell and run:

```powershell
py -0p
```

You want to see a `3.12` entry in the list.

Why this matters:

- The geospatial packages used here are much easier to install on Windows with Python 3.12 than with Python 3.13.

### 2. Create the local project environment

From the repository root:

```powershell
cd data-pipeline
py -3.12 -m venv .venv
```

This creates a private Python environment inside `data-pipeline/.venv/`. It keeps this project's packages separate from the rest of your machine.

### 3. Activate the environment

```powershell
.venv\Scripts\Activate.ps1
```

When activation worked, your prompt will start with `(.venv)`.

### 4. Upgrade the packaging tools inside the environment

```powershell
python -m pip install --upgrade pip setuptools wheel
```

### 5. Install the Python dependencies

Try the normal install first:

```powershell
pip install -r requirements.txt
```

If that works, you are done with Python setup.

If it fails on Windows because `rio-mbtiles` starts backtracking through incompatible `shapely` versions, use this fallback sequence instead:

```powershell
pip install shapely==2.1.2 numpy pandas pyproj pyogrio requests pyyaml click cligj affine attrs pyparsing certifi charset_normalizer idna urllib3
pip install geopandas==1.1.3 rasterio==1.5.0
pip install rio-mbtiles==1.6.0 --no-deps
pip install mercantile supermercado tqdm
```

That is the sequence used successfully in this project on Windows.

### 6. Optional quick verification

```powershell
python -c "import shapely, geopandas, rasterio; print(shapely.__version__, geopandas.__version__, rasterio.__version__)"
```

## Rebuilding the environment later

If the environment gets into a broken state, you can safely delete it and recreate it.

From `data-pipeline/`:

```powershell
Remove-Item -Recurse -Force .venv
py -3.12 -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
```

Notes:

- If `deactivate` says it is not recognized, that usually just means no environment is currently active. That is fine.
- If `Remove-Item` says `.venv` does not exist, that is also fine. It simply means there is nothing to remove yet.

## Quick start: rebuild the LL boundary and metadata files

Once the environment is active:

```powershell
python python\fetch_nuts.py
```

This regenerates:

- `../data/ll_metadata.json`
- `../data/nuts1_de.geojson`
- `../data/nuts3_ll.geojson`
- `../data/nuts3_ll_simplified.geojson`

## Syncing pipeline output into the app

The app reads data from `app/public/data/` at runtime. You do not need to copy files by hand.

From `data-pipeline/`, run:

```powershell
python sync.py
```

This will:

- copy `ll_metadata.json` and the GeoJSON files into `app/public/data/`
- copy any built `.pmtiles` files into `app/public/data/pmtiles/`
- regenerate `app/src/data/landuse_legend.js` from `sources/sources.yaml`

## Adding a new data source

Phase 4 introduces a declarative source registry. Until then, add a new Python script alongside `fetch_nuts.py` and write its output under `../data/` with a descriptive filename.

R-based sources are supported symmetrically - see `R/fetch_example.R` once it lands.

## Building tile layers

Thematic map layers are described in [`sources/sources.yaml`](./sources/sources.yaml). The current real layer is:

- `landuse-croptypes`: the DLR 2024 crop-types raster for Germany, clipped to the Living Lab area and converted into PMTiles

### Install the PMTiles command-line tool

The pipeline uses the separate `pmtiles.exe` program for the final conversion from MBTiles to PMTiles.

Download it from:

- https://github.com/protomaps/go-pmtiles/releases

Recommended place to store it on Windows:

- `C:\Users\<your-name>\Tools\pmtiles\pmtiles.exe`

For example:

```powershell
New-Item -ItemType Directory -Force C:\Users\black\Tools\pmtiles
Copy-Item "C:\Users\black\Downloads\go-pmtiles_1.30.2_Windows_x86_64\pmtiles.exe" "C:\Users\black\Tools\pmtiles\pmtiles.exe"
```

### Easiest way to make the script find `pmtiles.exe`

In the same PowerShell session where you run the pipeline:

```powershell
$env:PMTILES_BIN = "C:\Users\black\Tools\pmtiles\pmtiles.exe"
```

This avoids needing to edit your system `PATH` immediately.

Optional check:

```powershell
& $env:PMTILES_BIN --help
```

### Build the crop-types PMTiles layer

From `data-pipeline/`, with the environment active:

```powershell
python python\build_pmtiles.py --layer landuse-croptypes
```

What the script does:

1. Uses the local source raster at `../data/croptypes_2024.tif`
2. Clips it to the Living Lab boundary union
3. Reprojects it to Web Mercator (`EPSG:3857`)
4. Applies the categorical legend colors from `sources.yaml`
5. Builds temporary MBTiles
6. Converts MBTiles to `landuse-croptypes.pmtiles`

Expected result:

- `../data/pmtiles/landuse-croptypes.pmtiles`

### Then sync the outputs into the app

```powershell
python sync.py
```

### Full working Windows sequence

If you want the complete flow in one place, this is the sequence that worked:

```powershell
cd C:\git\LL-explorer\data-pipeline
py -3.12 -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip setuptools wheel
pip install shapely==2.1.2 numpy pandas pyproj pyogrio requests pyyaml click cligj affine attrs pyparsing certifi charset_normalizer idna urllib3
pip install geopandas==1.1.3 rasterio==1.5.0
pip install rio-mbtiles==1.6.0 --no-deps
pip install mercantile supermercado tqdm
$env:PMTILES_BIN = "C:\Users\black\Tools\pmtiles\pmtiles.exe"
python python\build_pmtiles.py --layer landuse-croptypes
python sync.py
```

## Practical notes

- The raw crop-types GeoTIFF stays outside git at `../data/croptypes_2024.tif`.
- Temporary build artifacts live under `../data/_cache/`.
- The generated PMTiles file is currently about 22.7 MB, which is small enough to keep in the repo.
- If a future layer becomes too large, reduce `max_zoom` in `sources.yaml` before making the deployment setup more complicated.
- `app/src/data/landuse_legend.js` is generated from `sources.yaml`. Do not edit it by hand.
