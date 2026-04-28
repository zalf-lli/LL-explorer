from __future__ import annotations

import hashlib
import os
import shutil
import sys
from pathlib import Path

import requests
import yaml


def repo_root() -> Path:
    return Path(__file__).absolute().parent.parent.parent


def resolve(path: str | Path) -> Path:
    candidate = Path(path)
    if candidate.is_absolute():
        return candidate
    return repo_root() / candidate


def sources_path() -> Path:
    return resolve("data-pipeline/sources/sources.yaml")


def load_sources() -> dict:
    with sources_path().open("r", encoding="utf-8") as handle:
        data = yaml.safe_load(handle) or {}
    data.setdefault("defaults", {})
    data.setdefault("layers", [])
    return data


def get_layer(layer_id: str) -> dict:
    sources = load_sources()
    for layer in sources["layers"]:
        if layer["id"] == layer_id:
            merged = dict(layer)
            merged["defaults"] = sources["defaults"]
            return merged
    available = ", ".join(layer["id"] for layer in sources["layers"]) or "(none)"
    raise KeyError(f"Unknown layer '{layer_id}'. Available layers: {available}")


def find_pmtiles_bin() -> str:
    env_bin = os.environ.get("PMTILES_BIN")
    if env_bin:
        return env_bin
    found = shutil.which("pmtiles")
    if found:
        return found
    raise RuntimeError(
        "Could not find the PMTiles CLI. Install it from "
        "https://github.com/protomaps/go-pmtiles/releases or set PMTILES_BIN."
    )


def find_rio_bin() -> str:
    scripts_dir = Path(sys.executable).resolve().parent
    candidates = [
        scripts_dir / "rio.exe",
        scripts_dir / "rio",
    ]
    for candidate in candidates:
        if candidate.exists():
            return str(candidate)

    found = shutil.which("rio")
    if found:
        return found

    raise RuntimeError(
        "Could not find the rasterio CLI ('rio'). Ensure rasterio is installed in the active environment."
    )


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _download(url: str, target: Path) -> None:
    partial = target.with_suffix(target.suffix + ".partial")
    target.parent.mkdir(parents=True, exist_ok=True)

    with requests.get(url, stream=True, timeout=120) as response:
        response.raise_for_status()
        total = int(response.headers.get("content-length", "0"))
        downloaded = 0
        last_reported = -1

        with partial.open("wb") as handle:
            for chunk in response.iter_content(chunk_size=1024 * 1024):
                if not chunk:
                    continue
                handle.write(chunk)
                downloaded += len(chunk)
                if total > 0:
                    percent = int(downloaded * 100 / total)
                    if percent // 5 != last_reported:
                        last_reported = percent // 5
                        print(f"[download] {percent}% ({downloaded / 1024 / 1024:.1f} MB)")
                else:
                    print(f"[download] {downloaded / 1024 / 1024:.1f} MB")

    partial.replace(target)


def ensure_input_available(layer: dict) -> Path:
    layer_input = layer["input"]
    input_path = resolve(layer_input["path"])
    download_url = layer_input.get("download_url")
    sha256 = layer_input.get("sha256")

    if input_path.exists():
        print(f"[input] using local file {input_path.relative_to(repo_root())}")
    elif download_url:
        print(f"[input] downloading {download_url}")
        _download(download_url, input_path)
    else:
        raise FileNotFoundError(
            f"No local file at {layer_input['path']} and no input.download_url set in sources.yaml."
        )

    if sha256:
        digest = _sha256(input_path)
        if digest != sha256:
            raise RuntimeError(
                f"SHA-256 mismatch for {input_path}. Expected {sha256}, got {digest}. "
                "Delete the file and re-run after confirming the source."
            )

    return input_path
