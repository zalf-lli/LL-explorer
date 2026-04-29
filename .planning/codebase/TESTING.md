# Testing Patterns

**Analysis Date:** 2026-04-29

## Test Framework

**Runner:**
- None detected/configured.
  - `app/package.json` has `dev`, `build`, `lint`, `format`, `format:check`, `preview`, `sync-data` scripts but no `test` script (`app/package.json`).
  - No `jest`, `vitest`, `mocha`, `playwright`, `cypress`, `pytest` configuration files detected in the repo.
- CI currently runs only a frontend build:
  - `.github/workflows/deploy-pages.yml` runs `npm ci` + `npm run build` in `app/` and does not run lint, tests, or coverage.

**Assertion Library:**
- Not applicable (no test runner configured).

**Run Commands:**
```bash
# No test runner is configured yet.
# Frontend quality gates available locally:
npm --prefix app run lint
npm --prefix app run format:check

# CI (current behavior):
# .github/workflows/deploy-pages.yml -> npm ci && npm run build (app/)
```

## Test File Organization

**Location:**
- Not applicable (no tests exist in this repo yet).

**Naming:**
- Not applicable currently.

**Structure:**
```text
# Recommended when tests are introduced:
app/src/                  # co-locate unit tests next to source (e.g. app/src/lib/foo.test.js)
data-pipeline/tests/      # pytest-style tests (e.g. data-pipeline/tests/test_sources.py)
```

## Test Structure

**Suite Organization:**
- Not established (no tests exist currently).

**Patterns:**
- Setup/teardown: Not applicable yet.
- Assertions: Not applicable yet.

## Mocking

**Framework:**
- Not configured (no test runner).

**Patterns:**
```js
// Not applicable currently.
// Recommended when adding a frontend test runner (Vitest):
// - stub `globalThis.fetch` for `app/src/hooks/useGeoJSON.js`
// - mock Leaflet/react-leaflet module surface in map component tests
```

**What to Mock:**
- If tests are added: network `fetch`, Leaflet integration, and any browser APIs not provided by the test environment.

**What NOT to Mock:**
- Pure helper logic (e.g. `app/src/lib/projection.js`, `app/src/lib/geojson.js`) should be tested with real inputs.

## Fixtures and Factories

**Test Data:**
- Not present yet.
- If tests are introduced: keep fixtures minimal and deterministic; for frontend JSON fetch tests, use small hand-authored payloads for `useGeoJSON` and `useLLMetadata`.

**Location:**
- Not applicable currently.

## Coverage

**Requirements:**
- None enforced (no coverage tool configured and CI does not upload coverage).

**View Coverage:**
```bash
# Not applicable (no coverage runner configured).
```

## Test Types

**Unit Tests:**
- Not used currently.
- Highest-value targets (recommended if you add tests):
  - Frontend pure helpers: `app/src/lib/projection.js`, `app/src/lib/geojson.js`
  - Data access/fetch hooks: `app/src/hooks/useGeoJSON.js`, `app/src/hooks/useLLMetadata.js`
  - Pipeline pure logic: `data-pipeline/python/_sources.py`

**Integration Tests:**
- Not used currently.
- Pipeline scripts can be validated with smoke runs against tiny synthetic inputs under temp dirs (see `data-pipeline/python/build_pmtiles.py`).

**E2E Tests:**
- Not used currently.
- If added later, prefer a Vite-aligned browser framework (e.g. Playwright) over Cypress for this app layout.

## Common Patterns

**Async Testing (recommended):**
```js
// Example pattern to use once a frontend runner exists:
// - render the hook/component
// - stub `fetch` to resolve/reject
// - assert on `loading`/`error` transitions
// Source targets: `app/src/hooks/useGeoJSON.js`, `app/src/hooks/useLLMetadata.js`
```

**Error Testing (recommended):**
```js
// - force `fetch` response with `ok: false` to trigger thrown errors
// - assert the UI renders inline error state
// UI targets: `app/src/App.jsx`, `app/src/components/LandingMap.jsx`, `app/src/components/LLMap/index.jsx`
```

---

*Testing analysis: 2026-04-29*

# Testing Patterns

**Analysis Date:** 2026-04-29

## Test Framework

**Status: No test framework is configured anywhere in this repository.**

- `app/package.json` declares no test runner (no `jest`, `vitest`, `mocha`, `playwright`, `cypress`, `@testing-library/*`) — see `app/package.json:16-38`.
- `app/package.json` `scripts` block has no `test` / `test:watch` / `test:ci` entry — only `dev`, `build`, `lint`, `format`, `format:check`, `preview`, `sync-data` (`app/package.json:7-15`).
- `data-pipeline/requirements.txt` lists no `pytest` / `unittest` extras / `hypothesis` — only the geospatial runtime dependencies `geopandas`, `shapely`, `requests`, `rasterio`, `rio-mbtiles`, `pyyaml`.
- The CI workflow at `.github/workflows/deploy-pages.yml` runs only `npm ci` + `npm run build` — there is no `npm test` step, no Python test step, no coverage upload.
- `npm run lint` and `npm run format:check` exist in `app/`, but are not executed by the current Pages workflow.
- No `tests/`, `__tests__/`, `*.test.*`, or `test_*.py` files exist anywhere under `app/src/` or `data-pipeline/python/`. The only matching files in the repo are inside `app/node_modules/` and `data-pipeline/.venv/site-packages/` (vendored dependency tests, not part of this project).

This reflects current repo state: the frontend CI only builds (`npm run build`), and the data pipeline is validated via manual runs (e.g. `npm run sync-data`).

**Implication for `/gsd-plan-phase` and `/gsd-execute-phase`:**

When a phase asks for new functionality, **do not assume an existing test runner**. Either:
1. Add code without tests (matches current practice), **or**
2. Introduce a test framework as part of the phase scope, with the user's agreement. Recommended choices given the stack:
   - **Frontend:** Vitest (native to Vite, zero-config) + `@testing-library/react` + `jsdom`. Add to `app/package.json` `devDependencies`, add a `vitest.config.js` next to `vite.config.js`, place tests next to source as `Foo.test.jsx`.
   - **Pipeline:** `pytest` in `data-pipeline/requirements.txt` (or a separate `requirements-dev.txt`). Place tests in `data-pipeline/tests/` as `test_*.py`. Use `tmp_path` and `monkeypatch` fixtures rather than mocking `requests` and `rasterio`.

Document the choice and the new test command in `app/package.json` and `data-pipeline/README.md` so subsequent phases can rely on it.

## Test File Organization

Not applicable — no tests exist yet. Sections below describe the **recommended** convention if/when tests are added, derived from existing source-file naming and import patterns.

**Recommended location:**
- Frontend: co-located with source. Example: `app/src/lib/buildMaskGeometry.test.js` next to `app/src/lib/buildMaskGeometry.js`.
- Pipeline: separate directory `data-pipeline/tests/test_<module>.py` (avoids picking up the existing `python/_sources.py` private prefix as a test).

**Recommended naming:**
- Frontend: `<SourceName>.test.js` for plain logic, `<Component>.test.jsx` for components rendering JSX. Match the case of the source file.
- Pipeline: `test_<module>.py`, mirroring the module under test (`test_sources.py` for `python/_sources.py`).

**Recommended structure:**
```
app/src/
├── lib/
│   ├── buildMaskGeometry.js
│   └── buildMaskGeometry.test.js      # Pure-function unit tests
├── hooks/
│   ├── useGeoJSON.js
│   └── useGeoJSON.test.jsx            # renderHook with fetch mock
└── components/
    ├── KPIStrip.jsx
    └── KPIStrip.test.jsx              # render + getByText assertions

data-pipeline/
├── python/
│   └── _sources.py
└── tests/
    ├── conftest.py                    # shared fixtures (tmp_path-based repo)
    └── test_sources.py
```

## Test Structure

Not yet established. When introducing tests, follow these guidelines so they integrate cleanly with the existing codebase:

**Frontend (Vitest + Testing Library):**
- Use `describe` per module/component and `test` (alias `it`) per behaviour.
- Lean on Testing Library's user-centric queries (`getByRole`, `getByText`) — most components in this project render plain text via `useTranslation()`, so initialise i18n in a test-setup file and assert on translated strings.
- Snapshot tests are discouraged for the SVG-heavy components (`Header.jsx`, `LLBadge.jsx`, `KPIStrip.jsx`) — they render large `dangerouslySetInnerHTML` payloads that produce noisy diffs.

**Pipeline (pytest):**
- Use plain `def test_*` functions; classes only when grouping is genuinely useful.
- Prefer `pytest`'s built-in `tmp_path`, `monkeypatch`, and `capsys` fixtures over manual setup/teardown.
- Mark slow / network-touching tests with `@pytest.mark.slow` or `@pytest.mark.network` and exclude them from the default run.

## Mocking

Not configured. Recommended approach when adding tests:

**Frontend:**
- Use Vitest's built-in `vi.fn()`, `vi.mock()`, and `vi.stubGlobal()`.
- For `fetch` (used by `useGeoJSON` and `useLLMetadata`), stub the global with a typed fake rather than swapping in `msw` — the surface area is small (two endpoints).
- For Leaflet / `react-leaflet`, mock the module entirely (`vi.mock('react-leaflet', ...)`) — Leaflet does not render in `jsdom` without a real canvas/DOM. Tests for `LLMap/index.jsx` should focus on the conditional branches (loading / error / coming-soon / available) and stub the map subtree.
- For `pmtiles`, mock `PMTiles` and `leafletRasterLayer`.

**Pipeline:**
- Mock outbound HTTP via `monkeypatch.setattr(requests, "get", fake_get)` — do not pull in `responses` or `httpx-mock` for this small surface.
- Mock external CLI lookups (`find_pmtiles_bin`, `find_rio_bin`) via `monkeypatch` rather than touching `shutil.which`.
- For raster IO, use small synthetic GeoTIFFs written to `tmp_path` instead of mocking `rasterio` — the library's behaviour is hard to fake correctly.

**What to mock:**
- Network (`fetch`, `requests.get`)
- File-system writes that escape `tmp_path`
- External binaries (`pmtiles`, `rio`)
- Browser APIs not in `jsdom` (`window.localStorage` — already wrapped in try/catch, but still mock for deterministic tests)

**What NOT to mock:**
- Pure helpers in `app/src/lib/` — test them with real inputs.
- `i18next` resources — feed real translations from `app/src/i18n.js`.
- `pathlib.Path` — use `tmp_path` instead.

## Fixtures and Factories

None exist. Recommended pattern:

**Frontend test data:**
- Place sample GeoJSON / metadata fixtures under `app/src/__fixtures__/` (or co-locate per module). Keep them small — full feature collections are unnecessary for unit tests.
- For Living Lab objects, build a factory wrapping `app/src/data/ll_display.js` and `useLLMetadata`'s `buildLL` shape so component tests can stay terse:
  ```js
  // app/src/__fixtures__/makeLL.js
  export function makeLL(overrides = {}) {
    return { slug: 'rheingau', num: '05', name: 'Rheingau', /* ... */, ...overrides }
  }
  ```

**Pipeline fixtures:**
- Synthesise minimal `sources.yaml` files in `tmp_path` for `_sources.py` tests instead of depending on the real `data-pipeline/sources/sources.yaml`.
- For raster tests, generate 4×4 single-band uint8 GeoTIFFs on the fly with `rasterio.open(..., 'w', ...)` — avoid checking binary fixtures into git.

## Coverage

**Requirements:** None enforced. No coverage tool is configured.

**Recommended:**
- After adding Vitest: `npm run test -- --coverage` (uses v8 by default, no extra dep).
- pytest: `pytest --cov=python --cov-report=term-missing` (requires `pytest-cov`).
- Do not gate CI on a coverage percentage early; focus first on covering the pure helpers in `app/src/lib/` and `data-pipeline/python/_sources.py`, which carry most of the logic risk.

## Test Types

**Unit tests:** Recommended starting point. Highest-value targets:
- `app/src/lib/buildMaskGeometry.js` — geometry edge cases (Polygon vs. MultiPolygon, missing/empty rings)
- `app/src/lib/projection.js` — bbox + projection math
- `app/src/lib/geojson.js` — coord walker and ring-to-path output
- `app/src/i18n.js` — `normalizeLanguage` for various Accept-Language inputs
- `app/src/data/ll_display.js` — `getLLOutlineColor` fallback behaviour
- `data-pipeline/python/_sources.py` — `resolve`, `load_sources`, `get_layer`, `_sha256`, `ensure_input_available`

**Integration tests:** Deferred. The data-pipeline scripts (`build_pmtiles.py`, `fetch_nuts.py`, `sync.py`) are best validated with smoke runs against tiny synthetic inputs in `tmp_path` rather than full geodata.

**Component tests:** Deferred. Most components are presentation-only and tightly coupled to inline styles — refactor to extract logic before adding tests.

**E2E tests:** Not used currently. If added later, prefer Playwright over Cypress for Vite ecosystem alignment.

## Common Patterns

**Async testing (frontend, recommended):**
```js
// Pattern for hooks that fetch JSON
import { renderHook, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { useGeoJSON } from './useGeoJSON.js'

test('returns parsed GeoJSON', async () => {
  vi.stubGlobal('fetch', vi.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve({ type: 'FeatureCollection', features: [] }) })
  ))
  const { result } = renderHook(() => useGeoJSON('data/test.geojson'))
  await waitFor(() => expect(result.current.loading).toBe(false))
  expect(result.current.data[0].features).toEqual([])
})
```

**Error testing (frontend, recommended):**
```js
test('reports fetch failure via error field', async () => {
  vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false, status: 500 })))
  const { result } = renderHook(() => useGeoJSON('data/missing.geojson'))
  await waitFor(() => expect(result.current.error).toBeTruthy())
  expect(result.current.data).toBeNull()
})
```

**Pipeline testing (recommended):**
```python
# data-pipeline/tests/test_sources.py
import pytest
from python._sources import get_layer, load_sources

def test_get_layer_unknown_lists_alternatives(monkeypatch, tmp_path):
    yaml_text = "defaults: {}\nlayers:\n  - id: foo\n"
    fake = tmp_path / "sources.yaml"
    fake.write_text(yaml_text, encoding="utf-8")
    monkeypatch.setattr("python._sources.sources_path", lambda: fake)
    with pytest.raises(KeyError, match="Available layers: foo"):
        get_layer("bar")
```

---

*Testing analysis: 2026-04-29*
