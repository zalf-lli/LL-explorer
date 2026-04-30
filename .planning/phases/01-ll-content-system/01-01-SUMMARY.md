---
status: complete
phase: 01-ll-content-system
plan: "01-01"
wave: 1
completed: 2026-04-29
requirements:
  - CONTENT-01
  - CONTENT-02
---

# Plan 01-01 Summary

## Outcome

Established `data/ll_content.json` as the single hand-authored Living Lab content source and moved metadata assembly into a dedicated generator.

## Changes

- Added `data/ll_content.json` with all five LL slugs, bilingual content, brand identity fields, ordering, region labels, mock flags, and temporary KPI placeholders.
- Added `data-pipeline/python/generate_metadata.py` to load authored content and build merged `data/ll_metadata.json` with authored-field precedence.
- Refactored `data-pipeline/python/fetch_nuts.py` to keep geometry/NUTS generation focused on spatial outputs while reading LL definitions from `ll_content.json`.
- Updated `data-pipeline/sync.py` to regenerate `data/ll_metadata.json` before syncing files into `app/public/data/`.

## Verification

- `python data-pipeline/sync.py`
- Confirmed authored values such as the East Brandenburg tagline and brand colour are preserved in `data/ll_metadata.json`

## Notes

- `data/ll_content.json` is read-only input for the pipeline and is not overwritten by sync or fetch scripts.
