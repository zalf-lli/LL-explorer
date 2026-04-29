# Phase 1: LL Content System - Research

**Researched:** 2026-04-29
**Domain:** Static metadata contract migration across offline Python pipeline and React SPA
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

No user constraints - all decisions at the agent's discretion.

### Locked Decisions
- The app remains a static Vite + React SPA with no backend.
- The source of truth for Phase 1 is a hand-authored `data/ll_content.json` merged into `data/ll_metadata.json`.
- The migration must preserve bilingual EN/DE content and the existing five LL slugs.

### the agent's Discretion
- Exact JSON nesting for authored display fields, so long as one file owns the data.
- Whether merge logic lives in `sync.py` directly or a dedicated helper module.
- Whether region labels and KPI placeholders remain in metadata for now or are derived separately.

### Deferred Ideas (OUT OF SCOPE)
- Replacing placeholder KPI values with computed pipeline values beyond what Phase 1 needs to keep the UI working.
- Generic chart contracts and vector-source work from Phases 2 and 3.
</user_constraints>

<architectural_responsibility_map>
## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Hand-authored LL copy and visual config | CDN/Static | Browser/Client | Stored in repo as JSON and consumed as static build input |
| Merge authored content with computed metadata | API/Backend | CDN/Static | Owned by the offline Python pipeline before files are committed |
| Serve merged LL metadata to the UI | CDN/Static | Browser/Client | `app/public/data/ll_metadata.json` is fetched at runtime |
| Render LL cards, headers, and badges | Browser/Client | CDN/Static | React reads the merged metadata and renders locale-specific UI |
</architectural_responsibility_map>

<research_summary>
## Summary

Phase 1 is a contract-migration problem, not a new-technology problem. The current repo already has the right architectural seam: Python produces committed data files in `data/`, `sync.py` mirrors them into `app/public/data/`, and React fetches `ll_metadata.json` once at runtime. The gap is that authored content and display identity are split across `fetch_nuts.py` and `app/src/data/ll_display.js`, so changing one LL requires touching multiple files and can drift.

The standard approach in a static data app like this is to separate authored inputs from computed outputs. A single repo-owned JSON file should hold bilingual copy plus stable visual identity fields; a pipeline step should merge that authored JSON with computed fields such as slugs, NUTS codes, geometry-derived facts, and any legacy KPI placeholders that still need to exist. The frontend should then treat `ll_metadata.json` as the only per-LL content contract.

**Primary recommendation:** Introduce `data/ll_content.json` as the authored source, move metadata assembly out of `fetch_nuts.py` into a dedicated generator, then remove `app/src/data/ll_display.js` by teaching the UI to read order, colours, region labels, KPI placeholders, and `mock` badge state from merged metadata.
</research_summary>

<standard_stack>
## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Python stdlib `json` + `pathlib` | built-in | Read/write metadata files deterministically | Already used everywhere in the pipeline |
| React 19 | current repo | Render LL cards and detail views from fetched metadata | Existing app architecture already depends on it |
| `fetch()` + module-scope cache | browser standard | Load `ll_metadata.json` once per page load | Existing `useLLMetadata` hook already uses this pattern |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| ESLint | current repo | Catch stale imports and broken frontend migration edges | Run after removing `ll_display.js` |
| Vite build | current repo | Verify runtime-fetch paths and bundling still work | Run after metadata contract changes |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Repo JSON + Python merge | CMS or admin UI | Adds infrastructure the project explicitly does not want |
| Runtime merge in React | Static prebuild merge | Runtime merge keeps dead config in JS and duplicates logic |
| Keep `fetch_nuts.py` as metadata owner | Dedicated `generate_metadata.py` | Separate generator is cleaner and avoids mixing remote fetch, geometry work, and authored content concerns |

**Installation:**
```bash
# No new dependencies required for Phase 1
```
</standard_stack>

<architecture_patterns>
## Architecture Patterns

### System Architecture Diagram

```text
data/ll_content.json
        |
        v
data-pipeline/python/generate_metadata.py <--- data-pipeline/python/fetch_nuts.py geometry + NUTS outputs
        |
        v
data/ll_metadata.json
        |
        v
data-pipeline/sync.py
        |
        +--> app/public/data/ll_metadata.json
        |
        +--> existing generated JS artifacts
                 |
                 v
         app/src/hooks/useLLMetadata.js
                 |
                 +--> Landing cards
                 +--> Header pills
                 +--> LL detail header / KPI strip / map outline / mock badge
```

### Recommended Project Structure
```text
data/
|-- ll_content.json          # human-authored LL content and display fields
|-- ll_metadata.json         # merged pipeline output consumed by app

data-pipeline/
|-- sync.py                  # copies merged output into app/public/data/
`-- python/
    |-- fetch_nuts.py        # geometry + NUTS source generation
    `-- generate_metadata.py # authored + computed metadata merge

app/src/
|-- hooks/useLLMetadata.js   # fetch + normalize merged contract
|-- pages/Landing.jsx        # LL card list reads badge/display fields
|-- pages/LLDetail.jsx       # detail header/badge reads merged metadata
`-- components/LLMap/index.jsx
```

### Pattern 1: Authored-input plus generated-output split
**What:** Treat `data/ll_content.json` as editable source and `data/ll_metadata.json` as generated artifact.
**When to use:** Static sites where non-code content and computed metadata must coexist.
**Example:** `sync.py` already follows this pattern for `layer_sources.js` and `landuse_legend.js`.

### Pattern 2: Thin runtime hook over stable JSON contract
**What:** Keep `useLLMetadata` responsible for language selection and light normalization only.
**When to use:** When metadata should be inspectable on disk and shared across multiple UI surfaces.
**Example:** `useLLMetadata` should map a slug to display-ready fields without reaching into sidecar config modules.

### Anti-Patterns to Avoid
- **Dual source of truth for LL identity:** keeping colours/order/icons in `ll_display.js` while copy lives in JSON recreates the current drift problem.
- **Generating authored JSON from Python:** `sync.py` and metadata generators may read `data/ll_content.json` but must never overwrite it.
- **Frontend-only badge logic with hidden translation strings:** the badge copy should come from i18n, while the boolean trigger comes from metadata.
</architecture_patterns>

<dont_hand_roll>
## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Editable LL content system | CMS, admin panel, DB-backed content API | Repo JSON file | The project is explicitly static and Git-based |
| Runtime metadata stitching | Multiple JS lookup maps and fallback merges | Prebuilt merged JSON | One fetchable contract is easier to audit and keeps build/runtime simpler |
| Badge localization inside metadata | Hardcoded translated badge strings per LL | Existing i18n resources + `mock` boolean | Avoids duplicated UI text in data files |

**Key insight:** The repo already has the correct static-build architecture. Phase 1 should consolidate the contract, not introduce new infrastructure.
</dont_hand_roll>

<common_pitfalls>
## Common Pitfalls

### Pitfall 1: Breaking slug order during migration
**What goes wrong:** Cards, nav pills, and detail routes reshuffle or mismatch iconography.
**Why it happens:** `LL_ORDER` currently lives in `ll_display.js`; removing that file without rehoming order breaks deterministic rendering.
**How to avoid:** Put order/numbering in the merged metadata and keep hook output sorted explicitly.
**Warning signs:** Header pill order differs from landing-card order after the migration.

### Pitfall 2: Regressing map outline colours
**What goes wrong:** `LLMap` loses the per-LL outline colour when `getLLOutlineColor()` disappears.
**Why it happens:** Outline colour is consumed indirectly from `ll_display.js`, not from the fetched metadata.
**How to avoid:** Surface outline colour on each LL object returned by `useLLMetadata` and update map consumers to use `ll.outlineColor`.
**Warning signs:** All outlines fall back to a single default colour.

### Pitfall 3: Hidden authored/computed key collisions
**What goes wrong:** Pipeline-computed fields overwrite human-authored text or vice versa in surprising ways.
**Why it happens:** Merge precedence is not enforced or tested.
**How to avoid:** Define the merge in one place, document that authored fields win on conflicts, and verify the output JSON after editing one tagline.
**Warning signs:** Changing `ll_content.json` does not propagate after running `sync.py`, or a computed field disappears unexpectedly.
</common_pitfalls>

<open_questions>
## Open Questions

1. **Where should placeholder KPI values live after `ll_display.js` is deleted?**
   - What we know: `KPIStrip.jsx` still depends on `area`, `farms`, `tempRange`, `precip`, and `soil`.
   - What's unclear: whether those are considered authored content or temporary computed metadata.
   - Recommendation: keep them in merged metadata for Phase 1, then replace them with true pipeline values in a later phase.

2. **Should `region` remain authored or be derived from NUTS codes?**
   - What we know: `LL_REGION` is hardcoded today and only distinguishes Brandenburg vs Hesse.
   - What's unclear: whether future regions need richer labels than what a simple derivation can provide.
   - Recommendation: store the current short region label in `ll_content.json` now to unblock deletion of `ll_display.js`.
</open_questions>

<sources>
## Sources

### Primary (HIGH confidence)
- `data-pipeline/python/fetch_nuts.py` - current metadata assembly and NUTS ownership
- `data-pipeline/sync.py` - current sync boundary between pipeline and app
- `app/src/hooks/useLLMetadata.js` - current merge point between fetched metadata and display config
- `app/src/data/ll_display.js` - current hardcoded display/order/KPI source
- `app/src/pages/Landing.jsx`, `app/src/pages/LLDetail.jsx`, `app/src/components/LLMap/index.jsx`, `app/src/components/KPIStrip.jsx` - current metadata consumers
- `.planning/ROADMAP.md`, `.planning/REQUIREMENTS.md`, `.planning/codebase/ARCHITECTURE.md` - phase scope and repo architecture
</sources>

<metadata>
## Metadata

**Research scope:**
- Core technology: Python static metadata generation + React runtime consumption
- Ecosystem: Existing repo stack only
- Patterns: authored-vs-generated data contracts, UI migration off sidecar config
- Pitfalls: ordering, colour regressions, merge precedence

**Confidence breakdown:**
- Standard stack: HIGH - no new tech, entirely repo-native
- Architecture: HIGH - directly validated against current files
- Pitfalls: HIGH - current coupling points are visible in code
- Code examples: HIGH - recommendations are grounded in existing project patterns

**Research date:** 2026-04-29
**Valid until:** 2026-05-29
</metadata>

---

*Phase: 01-ll-content-system*
*Research completed: 2026-04-29*
*Ready for planning: yes*
