import { useTranslation } from 'react-i18next'
import { C } from '../theme.js'
import { LAYER_COLORS } from '../data/layers.js'

export function MapLegend({ layer }) {
  const { t } = useTranslation()
  const cols = LAYER_COLORS[layer]
  if (!cols) return null
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px' }}>
      {Object.keys(cols).map((cat) => (
        <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: 2,
              background: cols[cat],
              flexShrink: 0,
              border: '1px solid rgba(2,35,34,0.08)',
            }}
          />
          <span style={{ fontSize: 11, color: C.black, opacity: 0.65 }}>{t(`legend.${layer}.${cat}`)}</span>
        </div>
      ))}
    </div>
  )
}
