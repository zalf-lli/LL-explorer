import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

export const STORAGE_KEY = 'll-explorer-lang'

export function normalizeLanguage(lang) {
  return lang?.toLowerCase().startsWith('de') ? 'de' : 'en'
}

function getInitialLanguage() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (saved) return normalizeLanguage(saved)
  } catch {
    // Ignore storage access issues and fall back to the browser language.
  }
  return normalizeLanguage(window.navigator.language)
}

const resources = {
  en: {
    translation: {
      app: {
        metadataErrorTitle: 'Failed to load Living Lab metadata.',
      },
      common: {
        loading: 'Loading...',
        loadingMap: 'Loading map...',
        language: 'Language',
      },
      header: {
        title: 'Living Lab Explorer',
      },
      landing: {
        eyebrow: 'Living Labs',
        title: 'Five Regions. Real-World Practice.',
        body:
          'In five living labs, we test innovative approaches together with practitioners on the ground. Pick a site on the map to explore its conditions, ambitions and progress.',
        listTitle: 'Living Labs',
      },
      kpi: {
        totalArea: 'Total area',
        activeFarms: 'Active farms',
        avgTemp: 'Avg. temp.',
        dominantSoil: 'Dominant soil',
      },
      layers: {
        landuse: 'Land Use',
        climate: 'Climate',
        soil: 'Soil',
        economic: 'Economic',
      },
      legend: {
        landuse: {
          arable: 'Arable',
          forest: 'Forest',
          grassland: 'Grassland',
          settlement: 'Settlement',
          water: 'Water',
        },
        climate: {
          arable: 'Very warm',
          forest: 'Temperate',
          grassland: 'Warm',
          settlement: 'Cool',
          water: 'Water / cold',
        },
        soil: {
          arable: 'Sandy loam',
          forest: 'Brown earth',
          grassland: 'Loam',
          settlement: 'Other',
          water: 'Water body',
        },
        economic: {
          arable: 'High output',
          forest: 'Low intensity',
          grassland: 'Medium',
          settlement: 'Built-up',
          water: 'N/A',
        },
      },
      charts: {
        landuse: {
          title: 'Land Use / Cover',
          unit: '% area',
          bars: {
            arableLand: 'Arable land',
            forest: 'Forest',
            grassland: 'Grassland',
            settlement: 'Settlement',
            water: 'Water',
          },
        },
        climate: {
          title: 'Mean Monthly Temp.',
          unit: 'deg C',
          bars: {
            jan: 'Jan',
            mar: 'Mar',
            may: 'May',
            jul: 'Jul',
            sep: 'Sep',
            nov: 'Nov',
          },
        },
        soil: {
          title: 'Soil Type Distribution',
          unit: '% area',
          bars: {
            sandyLoam: 'Sandy loam',
            loam: 'Loam',
            clayLoam: 'Clay loam',
            peat: 'Peat',
            other: 'Other',
          },
        },
        economic: {
          title: 'Farm Size Distribution',
          unit: '% farms',
          bars: {
            under10: '< 10 ha',
            from10To50: '10-50 ha',
            from50To200: '50-200 ha',
            over200: '> 200 ha',
          },
        },
      },
      barChart: {
        source: 'Source: placeholder data - {{unit}}',
      },
      textBlock: {
        placeholder: 'Narrative text placeholder - landscape context, research focus, key challenges',
      },
      map: {
        loadError: 'Failed to load map data. Check the browser console.',
        placeholder: 'Interactive map (Leaflet + PMTiles) lands in Phase 3',
      },
      llDetail: {
        loading: 'Loading Living Lab...',
        unknown: 'Unknown Living Lab: "{{slug}}"',
        designOption: 'Design option:',
        optionA: 'Option A',
        optionASub: 'Split Screen',
        optionADesc: 'Map fixed left - data panel scrolls right',
        optionB: 'Option B',
        optionBSub: 'Stacked',
        optionBDesc: 'Full-width sections - map then data below',
        wireframeNote: 'Wireframe prototype - placeholder data',
        landscapeMap: 'Landscape Map',
        landscapeMapHint: 'Click layers to change map theme',
        distributionTitle: '{{layer}} - distribution',
        aboutLandscape: 'About this Landscape',
        researchFocus: 'Research Focus',
        socioEconomicContext: 'Socio-economic Context',
        thematicMapHint: 'Thematic map changes with selected layer',
        compareTitle: 'Compare with another Living Lab',
        compareCompactTitle: 'Want to compare with another Living Lab?',
        compareBody: 'Secondary feature - select any two LLs to view side-by-side metrics',
        compareAction: 'Compare',
        compareCompactAction: 'Add for comparison',
      },
    },
  },
  de: {
    translation: {
      app: {
        metadataErrorTitle: 'Living-Lab-Metadaten konnten nicht geladen werden.',
      },
      common: {
        loading: 'Wird geladen...',
        loadingMap: 'Karte wird geladen...',
        language: 'Sprache',
      },
      header: {
        title: 'Reallabore Explorer',
      },
      landing: {
        eyebrow: 'Reallabore',
        title: 'Fünf Regionen. Echte Praxis.',
        body:
          'In fünf Reallaboren erproben wir innovative Ansätze gemeinsam mit Praxisakteuren vor Ort. Wählen Sie einen Standort auf der Karte, um Rahmenbedingungen, Ziele und Fortschritte zu erkunden.',
        listTitle: 'Reallabore',
      },
      kpi: {
        totalArea: 'Gesamtfläche',
        activeFarms: 'Aktive Betriebe',
        avgTemp: 'Durchschn. Temp.',
        dominantSoil: 'Dominanter Boden',
      },
      layers: {
        landuse: 'Landnutzung',
        climate: 'Klima',
        soil: 'Boden',
        economic: 'Okonomie',
      },
      legend: {
        landuse: {
          arable: 'Ackerland',
          forest: 'Wald',
          grassland: 'Grünland',
          settlement: 'Siedlung',
          water: 'Wasser',
        },
        climate: {
          arable: 'Sehr warm',
          forest: 'Gemäßigt',
          grassland: 'Warm',
          settlement: 'Kühl',
          water: 'Wasser / kalt',
        },
        soil: {
          arable: 'Sandiger Lehm',
          forest: 'Braunerde',
          grassland: 'Lehm',
          settlement: 'Sonstige',
          water: 'Gewässer',
        },
        economic: {
          arable: 'Hoher Output',
          forest: 'Geringe Intensität',
          grassland: 'Mittel',
          settlement: 'Bebaut',
          water: 'k. A.',
        },
      },
      charts: {
        landuse: {
          title: 'Landnutzung / Bedeckung',
          unit: '% Fläche',
          bars: {
            arableLand: 'Ackerland',
            forest: 'Wald',
            grassland: 'Grünland',
            settlement: 'Siedlung',
            water: 'Wasser',
          },
        },
        climate: {
          title: 'Mittlere Monatstemperatur',
          unit: 'Grad C',
          bars: {
            jan: 'Jan',
            mar: 'Mar',
            may: 'Mai',
            jul: 'Jul',
            sep: 'Sep',
            nov: 'Nov',
          },
        },
        soil: {
          title: 'Verteilung der Bodentypen',
          unit: '% Fläche',
          bars: {
            sandyLoam: 'Sandiger Lehm',
            loam: 'Lehm',
            clayLoam: 'Toniger Lehm',
            peat: 'Torf',
            other: 'Sonstige',
          },
        },
        economic: {
          title: 'Verteilung der Betriebsgrößen',
          unit: '% Betriebe',
          bars: {
            under10: '< 10 ha',
            from10To50: '10-50 ha',
            from50To200: '50-200 ha',
            over200: '> 200 ha',
          },
        },
      },
      barChart: {
        source: 'Quelle: Platzhalterdaten - {{unit}}',
      },
      textBlock: {
        placeholder: 'Textplatzhalter - Landschaftskontext, Forschungsfokus, zentrale Herausforderungen',
      },
      map: {
        loadError: 'Kartendaten konnten nicht geladen werden. Bitte Browser-Konsole prüfen.',
        placeholder: 'Interaktive Karte (Leaflet + PMTiles) folgt in Phase 3',
      },
      llDetail: {
        loading: 'Living Lab wird geladen...',
        unknown: 'Unbekanntes Living Lab: "{{slug}}"',
        designOption: 'Designoption:',
        optionA: 'Option A',
        optionASub: 'Geteilter Bildschirm',
        optionADesc: 'Karte links fixiert - Datenbereich scrollt rechts',
        optionB: 'Option B',
        optionBSub: 'Gestapelt',
        optionBDesc: 'Abschnitte in voller Breite - Karte oben, Daten darunter',
        wireframeNote: 'Wireframe-Prototyp - Platzhalterdaten',
        landscapeMap: 'Landschaftskarte',
        landscapeMapHint: 'Klicken Sie auf Ebenen, um das Thema der Karte zu wechseln',
        distributionTitle: '{{layer}} - Verteilung',
        aboutLandscape: 'Über diese Landschaft',
        researchFocus: 'Forschungsfokus',
        socioEconomicContext: 'Sozioökonomischer Kontext',
        thematicMapHint: 'Die thematische Karte verändert sich mit der gewählten Ebene',
        compareTitle: 'Mit einem anderen Living Lab vergleichen',
        compareCompactTitle: 'Mit einem anderen Living Lab vergleichen?',
        compareBody: 'Sekundäre Funktion - zwei Living Labs für einen Seitenvergleich auswählen',
        compareAction: 'Vergleichen',
        compareCompactAction: 'Zum Vergleich hinzufügen',
      },
    },
  },
}

i18n.use(initReactI18next).init({
  resources,
  lng: getInitialLanguage(),
  fallbackLng: 'en',
  supportedLngs: ['en', 'de'],
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
