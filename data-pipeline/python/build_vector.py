from __future__ import annotations

import argparse
import json
from pathlib import Path

from _sources import ensure_input_available, get_layer, load_sources, repo_root, resolve
from soil_semantics import apply_runtime_contract, load_semantic_lookup


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build vector GeoJSON from sources.yaml entries.")
    parser.add_argument("--layer", help="Layer id from sources.yaml")
    parser.add_argument("--list", action="store_true", help="List available vector layer ids")
    return parser.parse_args()


def list_layers() -> None:
    sources = load_sources()
    for layer in sources["layers"]:
        if layer.get("kind") == "vector":
            print(layer["id"])


def _validate_declared_crs(layer_id: str, actual_crs: object, declared_crs: str | None, label: str) -> None:
    if not declared_crs:
        return
    actual = str(actual_crs) if actual_crs is not None else None
    if actual != declared_crs:
        raise RuntimeError(
            f"[error] {layer_id} {label} CRS mismatch: expected {declared_crs}, got {actual or 'None'}."
        )


def _normalize_properties(frame) -> None:
    if "GEN_ID" in frame.columns:
        frame["GEN_ID"] = frame["GEN_ID"].round().astype("Int64")


def _load_semantic_frame(vector_cfg: dict):
    semantics_cfg = vector_cfg.get("semantics") or {}
    if not semantics_cfg:
        return None

    sqlite_path = semantics_cfg.get("sqlite_path")
    if not sqlite_path:
        raise RuntimeError("[error] vector.semantics must define sqlite_path.")

    source_path = resolve(sqlite_path)
    if not source_path.exists():
        raise RuntimeError(f"[error] semantic database not found: {source_path.relative_to(repo_root())}")
    return load_semantic_lookup(semantics_cfg, source_path)


def _write_geojson(frame, output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    payload = frame.to_json(drop_id=True, sort_keys=True)
    output_path.write_text(payload + "\n", encoding="utf-8")


def build_layer(layer_id: str) -> None:
    import geopandas as gpd
    from shapely import set_precision

    layer = get_layer(layer_id)
    if layer.get("kind") != "vector":
        raise RuntimeError(f"[error] layer '{layer_id}' is kind={layer.get('kind')}, expected kind=vector.")

    input_path = ensure_input_available(layer)
    input_cfg = layer.get("input", {})
    vector_cfg = layer.get("vector", {})
    output_cfg = layer.get("output", {})

    gpkg_layer = vector_cfg.get("gpkg_layer")
    if not gpkg_layer:
        raise RuntimeError(f"[error] layer '{layer_id}' is missing vector.gpkg_layer in sources.yaml.")

    keep_fields = list(vector_cfg.get("keep_fields", []))
    if not keep_fields:
        raise RuntimeError(f"[error] layer '{layer_id}' is missing vector.keep_fields in sources.yaml.")

    simplify_tolerance = float(vector_cfg.get("simplify_tolerance", 0.0005))
    coordinate_precision = float(vector_cfg.get("coordinate_precision", 0.0001))
    output_dir = resolve(vector_cfg.get("output_dir", "data/geojson"))
    output_pattern = output_cfg.get("geojson_pattern")
    source_crs = input_cfg.get("crs")
    clip_path = resolve("data/ll_boundaries.geojson")
    lookup = _load_semantic_frame(vector_cfg)

    print(f"[input] reading {input_path.relative_to(repo_root())} layer={gpkg_layer}")
    source = gpd.read_file(input_path, layer=gpkg_layer)
    _validate_declared_crs(layer_id, source.crs, source_crs, "source")
    source.geometry = source.geometry.make_valid()

    missing_fields = [field for field in keep_fields if field not in source.columns]
    if missing_fields:
        raise RuntimeError(f"[error] layer '{layer_id}' is missing expected fields: {', '.join(missing_fields)}")

    source = source[keep_fields + ["geometry"]].copy()
    _normalize_properties(source)
    if lookup is not None:
        source = source.merge(lookup, on="GEN_ID", how="left")
        apply_runtime_contract(source)

    boundaries = gpd.read_file(clip_path)
    if boundaries.crs is None:
        raise RuntimeError(f"[error] clip boundaries at {clip_path} have no CRS.")
    if "ll_slug" not in boundaries.columns:
        raise RuntimeError(f"[error] clip boundaries at {clip_path} are missing ll_slug.")
    if source.crs is None:
        raise RuntimeError(f"[error] source layer '{layer_id}' has no CRS.")

    boundaries = boundaries.to_crs(source.crs)

    if not output_dir.exists():
        output_dir.mkdir(parents=True, exist_ok=True)

    for row in boundaries.itertuples(index=False):
        slug = row.ll_slug
        mask = gpd.GeoDataFrame({"ll_slug": [slug]}, geometry=[row.geometry], crs=boundaries.crs)
        clipped = gpd.clip(source, mask)
        if clipped.empty:
            raise RuntimeError(
                f"[error] clip produced 0 features for ll_slug='{slug}'. Check CRS alignment and source coverage."
            )

        clipped = clipped.to_crs("EPSG:4326")
        clipped.geometry = clipped.geometry.make_valid()
        clipped.geometry = clipped.geometry.simplify(simplify_tolerance, preserve_topology=True)
        clipped.geometry = clipped.geometry.apply(lambda geom: set_precision(geom, grid_size=coordinate_precision))
        clipped = clipped[~clipped.geometry.is_empty].copy()
        clipped.geometry = clipped.geometry.make_valid()
        if clipped.empty:
            raise RuntimeError(f"[error] simplification removed all features for ll_slug='{slug}'.")
        if not clipped.geometry.is_valid.all():
            raise RuntimeError(f"[error] invalid geometries remain after processing ll_slug='{slug}'.")

        _normalize_properties(clipped)
        output_path = output_dir / output_pattern.format(slug=slug).split("/")[-1]
        _write_geojson(clipped, output_path)

        try:
            reloaded = gpd.read_file(output_path)
        except Exception as exc:
            raise RuntimeError(f"[error] failed to validate written GeoJSON for ll_slug='{slug}': {exc}") from exc
        if reloaded.empty:
            raise RuntimeError(f"[error] written GeoJSON is empty for ll_slug='{slug}'.")
        if str(reloaded.crs) != "EPSG:4326":
            raise RuntimeError(
                f"[error] written GeoJSON CRS mismatch for ll_slug='{slug}': expected EPSG:4326, got {reloaded.crs}."
            )

        size_kb = output_path.stat().st_size / 1024
        print(f"[ok] wrote {output_path.relative_to(repo_root())} ({len(clipped)} features, {size_kb:.0f} KB)")


def main() -> None:
    args = parse_args()
    if args.list:
        list_layers()
        return
    if not args.layer:
        raise SystemExit("Pass --layer <id> or --list")
    build_layer(args.layer)


if __name__ == "__main__":
    main()
