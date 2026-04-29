# Project State

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-04-29)

**Core value:** A researcher or stakeholder can open the app and immediately see accurate, up-to-date geodata and statistics for any of the five Living Labs — without any server infrastructure.

**Current focus:** Phase 1 — LL Content System

## Status

| Phase | Name | Status |
|-------|------|--------|
| 1 | LL Content System | Not started |
| 2 | BÜK Vector Pipeline | Not started |
| 3 | Chart Data Contract | Not started |

## Active Work

None yet. Run `/gsd-discuss-phase 1` to start.

## Open Questions (from research)

- Is BÜK1000 at `data/boart1000_ob_v20/` sufficient, or is BÜK200 required?
- What are the exact column names in the BÜK Shapefile? (check with `pyogrio.list_layers()` + `.columns`)
- Chart data embedded in `ll_metadata.json` OR separate per-LL files in `app/public/data/charts/`? (decide before Phase 3)
