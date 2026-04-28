import { useTranslation } from 'react-i18next'
import { C } from '../theme.js'
import { LAYER_COLORS, LAYER_INDEX } from '../data/layers.js'

export function MapLegend({ layer }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language?.startsWith('de') ? 'de' : 'en'
  const cfg = LAYER_INDEX.get(layer)
  const generatedLegend = cfg?.legend

  if (generatedLegend?.length) {
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px' }}>
        {generatedLegend.map((entry) => (
          <div key={entry.value} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                background: entry.color,
                flexShrink: 0,
                border: '1px solid rgba(2,35,34,0.08)',
              }}
            />
            <span style={{ fontSize: 11, color: C.black, opacity: 0.7 }}>{entry[lang] || entry.en}</span>
          </div>
        ))}
      </div>
    )
  }

  const cols = LAYER_COLORS[layer]
  if (!cols) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
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
      {cfg?.available === false ? (
        <div style={{ fontSize: 11, color: C.muted, fontStyle: 'italic' }}>{t('map.dataUnavailable')}</div>
      ) : null}
    </div>
  )
}
