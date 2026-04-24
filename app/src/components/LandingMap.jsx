import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { C } from '../theme.js'
import { useGeoJSON } from '../hooks/useGeoJSON.js'
import { buildProjection, featuresBbox } from '../lib/projection.js'
import { featureToPath } from '../lib/geojson.js'

const SVG_W = 420
const SVG_H = 560

// Static overview map of Germany with the five LL regions highlighted.
// Uses a cheap cosine-of-latitude projection — good enough for a small
// country-scale overview and far lighter than booting Leaflet on the
// landing page.
export function LandingMap({ lls, onPick }) {
  const { t } = useTranslation()
  const [hover, setHover] = useState(null)
  const { data, loading, error } = useGeoJSON([
    './data/nuts1_de.geojson',
    './data/nuts3_ll_simplified.geojson',
  ])

  // Derive paths during render; no effect sync (vercel rule: rerender-derived-state-no-effect).
  const mapData = useMemo(() => {
    if (!data || !lls) return null
    const [nuts1, nuts3] = data
    const bbox = featuresBbox(nuts1.features)
    const project = buildProjection(bbox, SVG_W, SVG_H, 16)
    const states = nuts1.features.map((f) => ({
      id: f.properties.NUTS_ID,
      d: featureToPath(f, project),
    }))
    const llPolys = lls.map((ll) => {
      const feats = nuts3.features.filter((f) => ll.nuts3.includes(f.properties.NUTS_ID))
      const d = feats.map((f) => featureToPath(f, project)).join(' ')
      return { slug: ll.slug, color: ll.color, colorDark: ll.colorDark, d }
    })
    return { states, llPolys, viewBox: `0 0 ${SVG_W} ${SVG_H}` }
  }, [data, lls])

  if (error) {
    return (
      <div style={{ color: C.orange, fontSize: 13, padding: 20 }}>
        {t('map.loadError')}
      </div>
    )
  }

  if (loading || !mapData) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: C.muted,
          fontSize: 13,
        }}
        >
        {t('common.loadingMap')}
      </div>
    )
  }

  return (
    <svg viewBox={mapData.viewBox} style={{ width: '100%', height: '100%', display: 'block' }}>
      {mapData.states.map((s) => (
        <path
          key={s.id}
          d={s.d}
          fill={C.surfaceDark}
          stroke={C.white}
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      ))}
      {mapData.llPolys.map((llp) => {
        const isHover = hover === llp.slug
        return (
          <g
            key={llp.slug}
            onMouseEnter={() => setHover(llp.slug)}
            onMouseLeave={() => setHover(null)}
            onClick={() => onPick(llp.slug)}
            style={{ cursor: 'pointer' }}
          >
            <path
              d={llp.d}
              fill={isHover ? llp.color : llp.colorDark}
              stroke={isHover ? C.mutedPale : 'rgba(255,255,255,0.7)'}
              strokeWidth={isHover ? 2.5 : 1.2}
              strokeLinejoin="round"
              style={{ transition: 'all 0.2s' }}
            />
          </g>
        )
      })}
    </svg>
  )
}
