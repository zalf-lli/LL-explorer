// Inline SVG icons for the KPI strip. Mirrors the `vb + paths` pattern used in
// data/ll_icons.js. Strokes use `currentColor` so the icon inherits the
// surrounding label colour and stays consistent under future theme tweaks.
//
// Keyed by the same identifiers used as i18n keys under `kpi.*`.

export const KPI_ICONS = {
  totalArea: {
    vb: '0 0 24 24',
    paths: `<rect x="3.5" y="3.5" width="17" height="17" rx="2" stroke="currentColor" stroke-width="1.6" fill="none"/>
<path d="M3.5 9 H20.5" stroke="currentColor" stroke-width="1.4" />
<path d="M9 3.5 V20.5" stroke="currentColor" stroke-width="1.4" />`,
  },
  activeFarms: {
    vb: '0 0 24 24',
    paths: `<path d="M4 20 V11 L12 5 L20 11 V20 Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" fill="none"/>
<path d="M10 20 V14 H14 V20" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" fill="none"/>`,
  },
  avgTemp: {
    vb: '0 0 24 24',
    paths: `<path d="M12 4 V14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
<circle cx="12" cy="17" r="3.2" stroke="currentColor" stroke-width="1.6" fill="none"/>
<path d="M9.5 4.5 a2.5 2.5 0 1 1 5 0 V14 a3.2 3.2 0 1 1 -5 0 Z" stroke="currentColor" stroke-width="1.6" fill="none"/>`,
  },
  dominantSoil: {
    vb: '0 0 24 24',
    paths: `<path d="M3 17 C7 13, 11 19, 15 15 S 21 16, 21 16" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" fill="none"/>
<path d="M3 12 C7 8, 11 14, 15 10 S 21 11, 21 11" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" fill="none"/>
<path d="M3 7 C7 3, 11 9, 15 5 S 21 6, 21 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" fill="none"/>`,
  },
}
