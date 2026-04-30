from __future__ import annotations

from pathlib import Path


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


LL_SLUGS = [
    "east-brandenburg",
    "havellandisches-luch",
    "north-hessian-loess",
    "hessian-low-mountain",
    "rheingau",
]
