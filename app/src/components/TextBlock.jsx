import { useTranslation } from 'react-i18next'
import { C } from '../theme.js'

// Placeholder narrative block. Shows a striped gradient that reads as
// "text coming soon" — replace with real prose from ll_metadata.json once
// stakeholders have filled in the content fields.
export function TextBlock({ title, lines = 4, height }) {
  const { t } = useTranslation()
  return (
    <div>
      {title ? (
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: C.teal,
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
            marginBottom: 8,
          }}
        >
          {title}
        </div>
      ) : null}
      <div
        style={{
          background: `repeating-linear-gradient(0deg, ${C.surfaceMid} 0px, ${C.surfaceMid} 1px, transparent 1px, transparent 20px)`,
          height: height || lines * 20,
          borderRadius: 4,
        }}
      />
      <div style={{ fontSize: 10, color: C.muted, marginTop: 6, fontStyle: 'italic' }}>
        {t('textBlock.placeholder')}
      </div>
    </div>
  )
}
