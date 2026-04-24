# Living Labs Explorer — wireframe demo

Interactive Quarto site presenting **three layout alternatives** for the five
German agricultural Living Lab dashboards. Built to demo to LL representatives
before committing to a design.

## What's here

- **Variant A — Hub + per-LL pages** (`variant-hub/`). Landing map of all 5 LLs;
  each LL has a dedicated page with a stable URL. Best for TYPO3 deep-links.
- **Variant B — Adaptive single-page** (`variant-adaptive/`). Persistent map + a
  swappable dashboard panel; supports comparing 2–5 LLs side-by-side.
- **Variant C — Tabs / cards** (`variant-tabs/`). All 5 LLs as tabs on one page.
  Lowest interactivity, easiest TYPO3 embed.

All three render the **same content** from `data/ll_metadata.json`. The
[ZALF brand](brand/) (light + dark) is copied from `DMI-website/`.

## Living Labs

Defined in `scripts/fetch_nuts.py` (`LL_DEFINITIONS`):

| Slug | Name | NUTS3 codes |
|---|---|---|
| east-brandenburg | East Brandenburg | DE409, DE40A, DE40B, DE40C |
| havellandisches-luch | Havelländisches Luch | DE406, DE408 *(verify)* |
| north-hessian-loess | North Hessian Loess Plain | DE734, DE737 |
| hessian-low-mountain | Hessian Low Mountain Range | DE721–DE725 |
| rheingau | Rheingau | DE71D *(verify)* |

Only `hessian-low-mountain` has real fact-sheet content (from `ll-fields.md`).
The other four use clearly-flagged mock content.

## Build & preview

Prerequisites:
- [Quarto](https://quarto.org/docs/get-started/) ≥ 1.4
- Python ≥ 3.10

One-time setup:
```bash
pip install -r requirements.txt
python scripts/fetch_nuts.py        # downloads NUTS, writes data/, generates per-LL pages
```

Local preview:
```bash
quarto preview                       # opens http://localhost:4848
```

Static build for deployment:
```bash
quarto render                        # writes _site/
```

## Adding / changing a Living Lab

1. Edit `LL_DEFINITIONS` in `scripts/fetch_nuts.py`.
2. Re-run `python scripts/fetch_nuts.py` — this regenerates `data/` and the
   per-LL pages in `variant-hub/ll/`. Variant B and C pick up new LLs
   automatically (driven by `ll_metadata.json`).
3. For real (non-mock) content, edit the `*_FACTSHEET_EN/DE` dicts in the script
   and set `mock=False` for that LL by adding it to the same branch as the
   Hessisches Mittelgebirge example.

## Multi-language

Quarto's `.lang.qmd` postfix convention:
- `index.qmd` — English (project-wide `lang: en` default)
- `index.de.qmd` — German

The navbar EN/DE toggle is hard-coded in `_quarto.yml` for the wireframe; for a
real site, swap to per-page language links if URLs need to map 1:1.

## TYPO3 deployment notes

- `quarto render` produces a self-contained `_site/` folder. All asset paths are
  root-relative (e.g. `/data/ll_metadata.json`) so the site assumes it's served
  from the domain root.
- For a sub-path deploy, add `site-url:` in `_quarto.yml` and re-render so
  Quarto rewrites internal links — but `fetch()` calls in the inline scripts
  still use root-relative paths and will need updating.
- TYPO3 options: (a) copy `_site/` into `fileadmin/ll-explorer/` and link
  directly; (b) embed individual variant pages via iframe; (c) integrate into
  TYPO3 templates via a custom extension that includes the rendered HTML.

## Out of scope (deferred)

- Destatis GENESIS-Online API integration (mock JSON only)
- Real KPIs / charts beyond placeholders
- Accessibility audit, mobile polish
- Per-LL real content for the four still-mocked LLs
