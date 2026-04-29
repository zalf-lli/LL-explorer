import { useTranslation } from 'react-i18next'
import { C } from '../theme.js'

const VARIANTS = {
  light: {
    background: 'rgba(236, 69, 24, 0.1)',
    border: 'rgba(236, 69, 24, 0.25)',
    color: C.orange,
  },
  dark: {
    background: 'rgba(255, 255, 255, 0.14)',
    border: 'rgba(255, 255, 255, 0.28)',
    color: C.white,
  },
}

export function PreliminaryDataBadge({ variant = 'light' }) {
  const { t } = useTranslation()
  const palette = VARIANTS[variant] || VARIANTS.light

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '5px 10px',
        borderRadius: 999,
        fontSize: 10,
        fontWeight: 800,
        letterSpacing: '0.04em',
        background: palette.background,
        border: `1px solid ${palette.border}`,
        color: palette.color,
      }}
    >
      {t('common.preliminaryDataBadge')}
    </span>
  )
}
