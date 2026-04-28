from __future__ import annotations

import json
import shutil
from pathlib import Path

from python._sources import get_layer, load_sources, repo_root, resolve


STATIC_DATA_FILES = [
    "data/ll_metadata.json",
    "data/nuts1_de.geojson",
    "data/nuts3_ll.geojson",
    "data/nuts3_ll_simplified.geojson",
]


def sync_file(source: Path, destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, destination)
    print(f"[sync] {source.relative_to(repo_root())} -> {destination.relative_to(repo_root())}")


def generate_landuse_legend() -> None:
    layer = get_layer("landuse-croptypes")
    legend = [
        {
            "value": entry["value"],
            "en": entry["label"]["en"],
            "de": entry["label"]["de"],
            "color": entry["color"],
        }
        for entry in layer["legend"]
    ]
    target = resolve("app/src/data/landuse_legend.js")
    body = (
        "// Generated from data-pipeline/sources/sources.yaml (landuse-croptypes).\n"
        "// Do not edit by hand; run `python data-pipeline/sync.py` after changing sources.yaml.\n"
        f"export const LANDUSE_LEGEND = {json.dumps(legend, indent=2, ensure_ascii=False)}\n"
    )
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(body, encoding="utf-8")
    print(f"[sync] generated {target.relative_to(repo_root())}")


def sync_pmtiles() -> None:
    sources = load_sources()
    for layer in sources["layers"]:
        output = layer.get("output", {})
        pmtiles_path = output.get("pmtiles")
        sync_target = output.get("sync_to")
        if not pmtiles_path or not sync_target:
            continue
        source = resolve(pmtiles_path)
        if not source.exists():
            print(f"[skip] missing {source.relative_to(repo_root())}")
            continue
        sync_file(source, resolve(sync_target))


def sync_to_app() -> None:
    for rel_path in STATIC_DATA_FILES:
        source = resolve(rel_path)
        sync_file(source, resolve(f"app/public/{rel_path}"))
    sync_pmtiles()
    generate_landuse_legend()


if __name__ == "__main__":
    sync_to_app()
