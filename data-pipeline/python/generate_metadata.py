from __future__ import annotations

import json
from copy import deepcopy
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
DATA = ROOT / "data"
CONTENT_FILE = DATA / "ll_content.json"
METADATA_FILE = DATA / "ll_metadata.json"


def load_ll_content(path: Path = CONTENT_FILE) -> dict[str, dict]:
    return json.loads(path.read_text(encoding="utf-8"))


def _deep_merge(computed: object, authored: object) -> object:
    if isinstance(computed, dict) and isinstance(authored, dict):
        merged = {key: deepcopy(value) for key, value in computed.items()}
        for key, value in authored.items():
            merged[key] = _deep_merge(merged.get(key), value) if key in merged else deepcopy(value)
        return merged
    return deepcopy(authored)


def _build_computed_record(slug: str, authored: dict) -> dict:
    return {
        "slug": slug,
        "contact": authored.get("contact", ""),
        "nuts3": authored.get("nuts3", []),
        "mock": authored.get("mock", False),
    }


def build_metadata(ll_content: dict[str, dict] | None = None) -> dict[str, dict]:
    content = load_ll_content() if ll_content is None else ll_content
    metadata: dict[str, dict] = {}
    for slug, authored in content.items():
        metadata[slug] = _deep_merge(_build_computed_record(slug, authored), authored)
    return metadata


def write_metadata(output_path: Path = METADATA_FILE, ll_content: dict[str, dict] | None = None) -> dict[str, dict]:
    metadata = build_metadata(ll_content)
    output_path.write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")
    return metadata


def main() -> None:
    write_metadata()
    print(f"[ok] wrote {METADATA_FILE.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
