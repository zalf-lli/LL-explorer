import { C } from '../theme.js'
import { LL_ICONS } from '../data/ll_icons.js'

const SIZES = {
  sm: { w: 28, p: 5 },
  md: { w: 52, p: 8 },
  lg: { w: 52, p: 9 },
  xl: { w: 64, p: 11 },
}

export function LLBadge({ slug, size = 'md' }) {
  const dims = SIZES[size] || SIZES.md
  const icon = LL_ICONS[slug]
  if (!icon) return null
  const inner = dims.w - dims.p * 2
  return (
    <div
      style={{
        width: dims.w,
        height: dims.w,
        borderRadius: '50%',
        background: C.badgeBg,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg
        width={inner}
        height={inner}
        viewBox={icon.vb}
        fill="none"
        dangerouslySetInnerHTML={{ __html: icon.paths }}
      />
    </div>
  )
}
