// Display-side metadata for each Living Lab: visual order, colour, and the
// legacy KPI placeholders from the wireframe. The content (name, tagline,
// descriptions) lives in data/ll_metadata.json and is fetched at runtime.
//
// Slugs match the keys in data/ll_metadata.json.

export const LL_ORDER = [
  'east-brandenburg',
  'havellandisches-luch',
  'north-hessian-loess',
  'hessian-low-mountain',
  'rheingau',
]

export const LL_DISPLAY = {
  'east-brandenburg': {
    num: '01',
    color: '#9bc72d',
    colorDark: '#5e781b',
    // KPI placeholders — will be replaced by pipeline outputs in Phase 4.
    kpi: { area: 2410, farms: 312, tempRange: '9.8°C avg', precip: '540 mm/yr', soil: 'Sandy loam' },
  },
  'havellandisches-luch': {
    num: '02',
    color: '#00b3ad',
    colorDark: '#005754',
    kpi: { area: 810, farms: 89, tempRange: '9.5°C avg', precip: '570 mm/yr', soil: 'Peat / gley' },
  },
  'north-hessian-loess': {
    num: '03',
    color: '#008581',
    colorDark: '#00413f',
    kpi: { area: 1140, farms: 204, tempRange: '9.1°C avg', precip: '680 mm/yr', soil: 'Loess / luvisol' },
  },
  'hessian-low-mountain': {
    num: '04',
    color: '#5ec597',
    colorDark: '#276d4e',
    kpi: { area: 960, farms: 178, tempRange: '8.0°C avg', precip: '750 mm/yr', soil: 'Brown earth' },
  },
  rheingau: {
    num: '05',
    color: '#359269',
    colorDark: '#225e43',
    kpi: { area: 450, farms: 143, tempRange: '11.2°C avg', precip: '550 mm/yr', soil: 'Slate / shallow loam' },
  },
}

// Short region label shown in nav and cards. Derived from the NUTS-3 codes in
// the metadata; hardcoded here for simplicity since the pipeline doesn't emit it yet.
export const LL_REGION = {
  'east-brandenburg': { en: 'Brandenburg', de: 'Brandenburg' },
  'havellandisches-luch': { en: 'Brandenburg', de: 'Brandenburg' },
  'north-hessian-loess': { en: 'Hesse', de: 'Hessen' },
  'hessian-low-mountain': { en: 'Hesse', de: 'Hessen' },
  rheingau: { en: 'Hesse', de: 'Hessen' },
}
