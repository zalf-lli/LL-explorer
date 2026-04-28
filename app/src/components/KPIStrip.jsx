import { useTranslation } from 'react-i18next'
import { C } from '../theme.js'
import { KPI_ICONS } from '../data/kpi_icons.js'

const KPI_DEFINITIONS = [
  { key: 'totalArea', value: (ll) => `${ll.area.toLocaleString()} km²` },
  { key: 'activeFarms', value: (ll) => `~${ll.farms}` },
  { key: 'avgTemp', value: (ll) => ll.tempRange },
  { key: 'dominantSoil', value: (ll) => ll.soil },
]

function KPIIcon({ name }) {
  const def = KPI_ICONS[name]
  if (!def) return null
  return (
    <svg
      viewBox={def.vb}
      width="14"
      height="14"
      aria-hidden="true"
      focusable="false"
      style={{ flexShrink: 0 }}
      dangerouslySetInnerHTML={{ __html: def.paths }}
    />
  )
}

// Temporary placeholder source; Phase 4 pipeline will populate real values.
export function KPIStrip({ ll, cols = 4 }) {
  const { t } = useTranslation()
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols},1fr)`, gap: 10 }}>
      {KPI_DEFINITIONS.map((def) => (
        <div
          key={def.key}
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
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <KPIIcon name={def.key} />
            <span>{t(`kpi.${def.key}`)}</span>
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.teal, lineHeight: 1.2 }}>
            {def.value(ll)}
          </div>
        </div>
      ))}
    </div>
  )
}
