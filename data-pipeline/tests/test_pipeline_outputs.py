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
    assert layer["vector"]["semantics"]["sqlite_path"] == "data/buek250_mgm_utm_v60/buek250_sachdatenbank_v10.sqlite"
    assert layer["vector"]["semantics"]["contract_version"] == "buek250-soil-semantics-v1"
    assert layer["vector"]["semantics"]["tables"]["legend"] == "buek250_Legendeneinheit__v10_tbl"
    assert layer["vector"]["semantics"]["tables"]["general_legend"] == "buek250_GL_Einheit_v10_tbl"
    assert layer["vector"]["semantics"]["tables"]["parent_material"] == "buek250_GL_BAGFlaechentyp_v10_tbl"
    assert layer["vector"]["semantics"]["tables"]["profile"] == "buek250_Profil__v10_tbl"
    assert layer["vector"]["semantics"]["tables"]["horizon"] == "buek250_Horizont__v10_tbl"
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
        assert set(
            [
                "feature_kind",
                "soil_label_de",
                "soil_label_en",
                "soil_group_key",
                "soil_group_de",
                "soil_group_en",
                "general_unit_de",
                "general_unit_en",
                "parent_material_code",
                "parent_material_de",
                "parent_material_en",
                "profile_summary_de",
                "profile_summary_en",
                "profile_count",
                "lead_horizon_count",
                "semantic_source",
                "semantic_version",
            ]
        ).issubset(gdf.columns)
        assert gdf.loc[gdf["feature_kind"] == "soil_unit", "soil_label_en"].notna().any(), (
            f"Missing translated soil labels: {path.name}"
        )
        assert gdf.loc[gdf["feature_kind"] != "soil_unit", "feature_kind"].isin(["water_area", "special_area"]).all()
        assert gdf.geometry.notna().all(), f"Fixture has null geometries: {path.name}"
