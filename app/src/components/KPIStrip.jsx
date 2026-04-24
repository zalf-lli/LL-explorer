import { useTranslation } from 'react-i18next'
import { C } from '../theme.js'

// Temporary placeholder source; Phase 4 pipeline will populate real values.
export function KPIStrip({ ll, cols = 4 }) {
  const { t } = useTranslation()
  const items = [
    { label: t('kpi.totalArea'), value: `${ll.area.toLocaleString()} km²` },
    { label: t('kpi.activeFarms'), value: `~${ll.farms}` },
    { label: t('kpi.avgTemp'), value: ll.tempRange },
    { label: t('kpi.dominantSoil'), value: ll.soil },
  ]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols},1fr)`, gap: 10 }}>
      {items.map((k) => (
        <div
          key={k.label}
          style={{
            background: C.white,
            borderRadius: 10,
            padding: '12px 14px',
            border: `1px solid ${C.mutedLight}`,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: C.greenMid,
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              marginBottom: 4,
            }}
          >
            {k.label}
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.teal, lineHeight: 1.2 }}>
            {k.value}
          </div>
        </div>
      ))}
    </div>
  )
}
