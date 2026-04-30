---
status: complete
phase: 01-ll-content-system
plan: "01-02"
wave: 2
completed: 2026-04-29
requirements:
  - CONTENT-03
  - CONTENT-04
---

# Plan 01-02 Summary

## Outcome

Removed the frontend-side LL display lookup file and switched the app to a metadata-only LL contract, including preliminary-data badges.

## Changes

- Reworked `app/src/hooks/useLLMetadata.js` to normalize all LL display fields directly from `ll_metadata.json`.
- Deleted `app/src/data/ll_display.js` and updated `app/src/components/LLMap/index.jsx` to consume `ll.outlineColor`.
- Added `app/src/components/PreliminaryDataBadge.jsx` and rendered it in both `app/src/pages/Landing.jsx` and `app/src/pages/LLDetail.jsx` whenever `ll.mock` is `true`.
- Added an i18n key for the bilingual badge label: `Preliminary data / Vorläufige Daten`.

## Verification

- `npm run lint`
- `npm run build`
- Confirmed `rg -n "ll_display|LL_DISPLAY|LL_ORDER|LL_REGION|getLLOutlineColor" app/src` returns no matches

## Notes

- The production build required an unsandboxed rerun because Vite hit a Windows `spawn EPERM` restriction in the sandbox, but the build completed successfully once rerun outside it.
