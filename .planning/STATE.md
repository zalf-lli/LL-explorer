# Project State

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-04-29)

**Core value:** A researcher or stakeholder can open the app and immediately see accurate, up-to-date geodata and statistics for any of the five Living Labs â€” without any server infrastructure.

**Current focus:** Phase 2 â€” BÃœK Vector Pipeline

## Status

| Phase | Name | Status |
|-------|------|--------|
| 1 | LL Content System | Complete (2026-04-29) |
| 2 | BÃœK Vector Pipeline | Not started |
| 3 | Chart Data Contract | Not started |

## Active Work

Phase 1 execution completed on 2026-04-29.
- Plan `01-01`: completed metadata source-of-truth and merge pipeline
- Plan `01-02`: completed metadata-only frontend migration and preliminary-data badges
- Next suggested step: start Phase 2 planning/execution for the BÃœK vector pipeline

## Open Questions (from research)

- Is BÃœK1000 at `data/boart1000_ob_v20/` sufficient, or is BÃœK200 required?
- What are the exact column names in the BÃœK Shapefile? (check with `pyogrio.list_layers()` + `.columns`)
- Chart data embedded in `ll_metadata.json` OR separate per-LL files in `app/public/data/charts/`? (decide before Phase 3)
