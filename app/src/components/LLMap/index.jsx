import { useTranslation } from 'react-i18next'
import { C } from '../../theme.js'
import { MapLegend } from '../MapLegend.jsx'

// Placeholder used until Phase 3 swaps in a real Leaflet + PMTiles map.
// Rendered via React.lazy in LLDetail so the eventual Leaflet bundle is
// kept out of the landing chunk.
export default function LLMap({ slug, layer, height = 300 }) {
  const { t } = useTranslation()
  const layerLabel = t(`layers.${layer}`)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height }}>
      <div
        style={{
          flex: 1,
          background: `linear-gradient(135deg, ${C.surface} 0%, ${C.surfaceDark} 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 10,
          color: C.green,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: C.greenMid,
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
          }}
        >
          {layerLabel} · {slug}
        </div>
        <div style={{ fontSize: 13, color: C.muted, fontStyle: 'italic' }}>
          {t('map.placeholder')}
        </div>
      </div>
      <div style={{ padding: '10px 16px', borderTop: `1px solid ${C.mutedLight}`, background: C.bg }}>
        <MapLegend layer={layer} />
      </div>
    </div>
  )
}
