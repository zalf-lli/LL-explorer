from __future__ import annotations

import argparse
import subprocess
import sys
import tempfile
from pathlib import Path

from _sources import ensure_input_available, find_pmtiles_bin, find_rio_bin, get_layer, load_sources, repo_root, resolve


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build raster PMTiles from sources.yaml entries.")
    parser.add_argument("--layer", help="Layer id from sources.yaml")
    parser.add_argument("--list", action="store_true", help="List available layer ids")
    return parser.parse_args()


def hex_to_rgba(color: str) -> tuple[int, int, int, int]:
    value = color.lstrip("#")
    if len(value) != 6:
        raise ValueError(f"Expected 6-digit hex color, got {color}")
    return tuple(int(value[index : index + 2], 16) for index in (0, 2, 4)) + (255,)


def build_colormap(layer: dict, nodata: int | float | None) -> dict[int, tuple[int, int, int, int]]:
    cmap = {int(entry["value"]): hex_to_rgba(entry["color"]) for entry in layer["legend"]}
    if nodata is not None:
        cmap[int(nodata)] = (0, 0, 0, 0)
    return cmap


def build_clip_geometry(layer: dict, source_crs) -> object:
    import geopandas as gpd

    defaults = layer["defaults"]
    clip_path = resolve(defaults["clip_to"])
    clip_buffer_m = defaults.get("clip_buffer_m", 0)
    gdf = gpd.read_file(clip_path)
    buffered = gdf.to_crs("EPSG:3857").geometry.union_all().buffer(clip_buffer_m)
    clip_geom = gpd.GeoSeries([buffered], crs="EPSG:3857").to_crs(source_crs).iloc[0]
    return clip_geom


def build_paletted_geotiff(layer: dict, input_path: Path, output_tif: Path) -> tuple[float, float, float, float]:
    import numpy as np
    import rasterio
    from rasterio.enums import ColorInterp, Resampling
    from rasterio.mask import mask
    from rasterio.transform import array_bounds
    from rasterio.warp import calculate_default_transform, reproject

    build_cfg = layer.get("build", {})
    target_crs = build_cfg.get("target_crs") or layer["defaults"]["target_crs"]
    input_cfg = layer["input"]

    with rasterio.open(input_path) as src:
        if src.count != 1:
            raise RuntimeError(f"Expected a single-band categorical raster, found {src.count} bands in {input_path}")

        declared_nodata = input_cfg.get("nodata")
        source_nodata = src.nodata if src.nodata is not None else declared_nodata
        if source_nodata is None:
            source_nodata = 0
        if declared_nodata is not None and src.nodata is not None and declared_nodata != src.nodata:
            print(f"[warn] YAML nodata={declared_nodata} but source nodata={src.nodata}; using source value")

        clip_geom = build_clip_geometry(layer, src.crs)
        clipped, clipped_transform = mask(
            src,
            [clip_geom.__geo_interface__],
            crop=True,
            all_touched=True,
            nodata=source_nodata,
        )

        bounds = array_bounds(clipped.shape[1], clipped.shape[2], clipped_transform)
        dst_transform, dst_width, dst_height = calculate_default_transform(
            src.crs,
            target_crs,
            clipped.shape[2],
            clipped.shape[1],
            *bounds,
        )

        class_profile = src.profile.copy()
        class_profile.update(
            driver="GTiff",
            height=dst_height,
            width=dst_width,
            transform=dst_transform,
            crs=target_crs,
            count=1,
            dtype="uint8",
            nodata=source_nodata,
            compress="deflate",
            tiled=True,
        )

        output_tif.parent.mkdir(parents=True, exist_ok=True)
        class_data = np.full((dst_height, dst_width), source_nodata, dtype=np.uint8)
        reproject(
            source=clipped[0],
            destination=class_data,
            src_transform=clipped_transform,
            src_crs=src.crs,
            src_nodata=source_nodata,
            dst_transform=dst_transform,
            dst_crs=target_crs,
            dst_nodata=source_nodata,
            resampling=Resampling.nearest,
        )

        rgba = np.zeros((4, dst_height, dst_width), dtype=np.uint8)
        for value, color in build_colormap(layer, None).items():
            mask_value = class_data == value
            if not np.any(mask_value):
                continue
            rgba[0][mask_value] = color[0]
            rgba[1][mask_value] = color[1]
            rgba[2][mask_value] = color[2]
            rgba[3][mask_value] = color[3]

        rgba_profile = class_profile.copy()
        rgba_profile.update(count=4, dtype="uint8", nodata=None)

        with rasterio.open(output_tif, "w", **rgba_profile) as dst:
            dst.write(rgba)
            dst.colorinterp = (
                ColorInterp.red,
                ColorInterp.green,
                ColorInterp.blue,
                ColorInterp.alpha,
            )
            return dst.bounds


def build_mbtiles(paletted_tif: Path, output_mbtiles: Path, min_zoom: int, max_zoom: int, tile_size: int) -> None:
    output_mbtiles.parent.mkdir(parents=True, exist_ok=True)
    cmd = [
        find_rio_bin(),
        "mbtiles",
        str(paletted_tif),
        "-o",
        str(output_mbtiles),
        "--zoom-levels",
        f"{min_zoom}..{max_zoom}",
        "--tile-size",
        str(tile_size),
        "--format",
        "PNG",
    ]
    print("[run]", " ".join(cmd))
    subprocess.run(cmd, check=True)


def convert_pmtiles(output_mbtiles: Path, output_pmtiles: Path) -> None:
    output_pmtiles.parent.mkdir(parents=True, exist_ok=True)
    cmd = [find_pmtiles_bin(), "convert", str(output_mbtiles), str(output_pmtiles)]
    print("[run]", " ".join(cmd))
    subprocess.run(cmd, check=True)


def list_layers() -> None:
    sources = load_sources()
    for layer in sources["layers"]:
        print(layer["id"])


def build_layer(layer_id: str) -> None:
    layer = get_layer(layer_id)
    input_path = ensure_input_available(layer)

    build_cfg = layer.get("build", {})
    min_zoom = int(build_cfg.get("min_zoom", layer["defaults"]["min_zoom"]))
    max_zoom = int(build_cfg.get("max_zoom", layer["defaults"]["max_zoom"]))
    tile_size = int(build_cfg.get("tile_size", layer["defaults"]["tile_size"]))
    output_pmtiles = resolve(layer["output"]["pmtiles"])

    cache_root = repo_root() / "data" / "_cache"
    cache_root.mkdir(parents=True, exist_ok=True)

    with tempfile.TemporaryDirectory(prefix=f"{layer_id}-", dir=cache_root) as temp_dir:
        temp_dir_path = Path(temp_dir)
        paletted_tif = temp_dir_path / f"{layer_id}.tif"
        temp_mbtiles = temp_dir_path / f"{layer_id}.mbtiles"

        bounds = build_paletted_geotiff(layer, input_path, paletted_tif)
        build_mbtiles(paletted_tif, temp_mbtiles, min_zoom, max_zoom, tile_size)
        convert_pmtiles(temp_mbtiles, output_pmtiles)

    size_mb = output_pmtiles.stat().st_size / 1024 / 1024
    print(f"[ok] wrote {output_pmtiles.relative_to(repo_root())} ({size_mb:.1f} MB)")
    print(f"[ok] bounds {bounds}")


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
