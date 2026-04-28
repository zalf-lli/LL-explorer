// Generated from data-pipeline/sources/sources.yaml.
// Do not edit by hand; run `python data-pipeline/sync.py` after changing sources.yaml.
export const LAYER_SOURCES = [
  {
    "id": "landuse-croptypes",
    "appLayer": "landuse",
    "title": {
      "en": "Crop types (DLR, 2024)",
      "de": "Anbaukulturen (DLR, 2024)"
    },
    "description": {
      "en": "Annual 10 m crop-type map for Germany derived from Sentinel-1/2 and LPIS with Random Forest.",
      "de": "Jaehrliche 10-m-Anbaukulturkarte fuer Deutschland aus Sentinel-1/2 und LPIS mit Random Forest."
    },
    "provider": "German Aerospace Center (DLR)",
    "dataset": "CROPTYPES_DE_P1Y (2024 edition)",
    "url": "https://geoservice.dlr.de/web/datasets/croptypes_de",
    "license": "CC-BY-4.0",
    "attribution": "(c) DLR (2024), CC BY 4.0",
    "citation": "Asam et al. 2022"
  }
]

export const LAYER_SOURCE_INDEX = new Map(LAYER_SOURCES.map((s) => [s.appLayer, s]))
