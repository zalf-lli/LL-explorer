# Source registry

`sources.yaml` is the declarative registry for thematic layers that the pipeline can build and the app can render.

The current file contains one real layer entry:

- `landuse-croptypes`: DLR 2024 crop-type raster for Germany, clipped to the Living Lab union and packaged as raster PMTiles.

## What belongs in each layer entry

- Source metadata: provider, dataset, citation, license, attribution
- Input details: local cache path, optional download URL, CRS, nodata
- Build settings: target CRS, zoom range, resampling, tile size
- Output targets: pipeline PMTiles path and app sync path
- Legend rows: `{ value, label.en, label.de, color }`

## Legend note

Before the first production build, replace the placeholder `legend` labels and colors with the full 18-class table from the DLR material for the 2024 crop-types release. Once `sources.yaml` is updated, re-run:

```powershell
python sync.py
```

That regenerates `app/src/data/landuse_legend.js` from the registry.
