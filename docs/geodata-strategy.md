Good — that scope makes the decision cleaner. **PMTiles is the right call, but you don't need to over-engineer it.**

## What your numbers imply

"Large farm" zoom in Germany means roughly zoom level 14–15 (tiles showing features ~10–40 m across). For 5 small NUTS-3 regions, that's a modest tile count — probably 500–3,000 tiles per raster layer depending on region size, well within the range where PMTiles shines.

Rough size estimate per raster layer (clipped to your 5 regions, zoom 8–15):
- Categorical data (land use/cover): ~1–5 MB as PMTiles with good PNG compression
- Continuous data (climate, soil properties): ~3–10 MB, depending on how much you quantize the color ramp

**10 raster layers × ~5 MB average ≈ 50 MB total.** That's the upper bound. Users only download tiles for the layer and area they're viewing, so actual bandwidth per session is tiny — maybe 1–3 MB. This is well within what Typo3 can serve as static assets later.

## Revised recommendation

Stick with **react-leaflet + PMTiles**. Specifically:

- [`protomaps-leaflet`](https://github.com/protomaps/protomaps-leaflet) or [`leaflet-pmtiles`](https://github.com/protomaps/PMTiles/tree/main/js) for loading PMTiles into Leaflet
- One PMTiles file per raster layer (keeps things organized and lets you lazy-load)
- GeoJSON/TopoJSON for the NUTS-3 boundaries and any vector overlays
- React state (or Zustand if it grows) to sync the active layer with your charts

## Processing pipeline

For each raster, roughly:

1. Clip to a bounding box covering all 5 regions (with small buffer)
2. Reproject to EPSG:3857 (Web Mercator)
3. For categorical rasters: apply a color table, export as PNG tiles
4. For continuous rasters: apply a color ramp during tiling
5. Convert the tile directory to a single `.pmtiles` file with the `pmtiles` CLI

Tools: `gdal2tiles.py` or `rio-tiler` for the tiling step, then `pmtiles convert` to pack them. Can be fully automated as a Python script you re-run whenever source data updates.

One gotcha worth flagging: if you want users to hover a pixel and see the underlying value (e.g., "soil organic carbon: 2.3%"), PNG tiles lose that — they're just colors. If you need that later, switch to **Cloud Optimized GeoTIFFs** served via [`georaster-layer-for-leaflet`](https://github.com/GeoTIFF/georaster-layer-for-leaflet). Slightly heavier but keeps the data values accessible. You mentioned no geo queries needed, so PNG tiles are fine — just know this is the upgrade path.

## Suggested starting point

If this is your first real React + mapping project, I'd build it in this order:

1. Static React app with react-leaflet showing NUTS-3 boundaries from GeoJSON
2. Add tab UI that switches a single raster layer (start with one PMTiles file)
3. Wire up a chart component that reacts to the active layer via shared state
4. Scale out to all 10 layers and both region selection + layer selection

Want me to sketch out the React component structure for the layer-switching + chart-sync pattern? That's usually the part where people get tangled, and getting it right early saves a lot of refactoring.