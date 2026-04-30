from __future__ import annotations

import geopandas as gpd
import yaml

from conftest import LL_SLUGS, repo_root


def load_sources() -> dict:
    path = repo_root() / "data-pipeline" / "sources" / "sources.yaml"
    with path.open("r", encoding="utf-8") as handle:
        return yaml.safe_load(handle) or {}


def get_layer(layer_id: str) -> dict:
    sources = load_sources()
    for layer in sources.get("layers", []):
        if layer["id"] == layer_id:
            return layer
    raise AssertionError(f"Layer {layer_id!r} not found in sources.yaml")


def test_pmtiles_fixture_exists_and_is_nonzero() -> None:
    pmtiles_path = repo_root() / "app" / "public" / "data" / "pmtiles" / "landuse-croptypes.pmtiles"
    assert pmtiles_path.exists(), f"Missing PMTiles fixture: {pmtiles_path}"
    assert pmtiles_path.stat().st_size > 0, f"PMTiles fixture is empty: {pmtiles_path}"


def test_buek250_layer_contract_declared() -> None:
    layer = get_layer("buek250")
    assert layer["kind"] == "vector"
    assert layer["input"]["path"] == "data/buek250_mgm_utm_v60/buek250_mgm_utm_v60.gpkg"
    assert layer["input"]["crs"] == "EPSG:25832"
    assert layer["build"]["script"] == "python/build_vector.py"
    assert layer["vector"]["keep_fields"] == ["SYM_NR", "GEN_ID", "BEMERKUNG"]
    assert layer["output"]["geojson_pattern"] == "data/geojson/buek250-{slug}.geojson"


def test_buek250_geojson_fixtures_exist_and_match_contract() -> None:
    pattern = get_layer("buek250")["output"]["geojson_pattern"]

    for slug in LL_SLUGS:
        path = repo_root() / pattern.format(slug=slug)
        assert path.exists(), f"Missing GeoJSON fixture: {path}"

        gdf = gpd.read_file(path)
        assert str(gdf.crs) == "EPSG:4326", f"Unexpected CRS for {path.name}: {gdf.crs}"
        assert len(gdf) > 0, f"Fixture has no features: {path.name}"
        assert set(["SYM_NR", "GEN_ID", "BEMERKUNG"]).issubset(gdf.columns)
        assert gdf.geometry.notna().all(), f"Fixture has null geometries: {path.name}"
