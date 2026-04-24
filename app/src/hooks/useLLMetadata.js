import { useEffect, useState } from 'react'
import { LL_DISPLAY, LL_ORDER, LL_REGION } from '../data/ll_display.js'

// Fetched once per page load and cached in module scope. The file is small (~16 KB).
let cache = null
let inflight = null

function fetchMetadata() {
  if (cache) return Promise.resolve(cache)
  if (inflight) return inflight
  inflight = fetch('./data/ll_metadata.json')
    .then((r) => {
      if (!r.ok) throw new Error(`Failed to load ll_metadata.json: ${r.status}`)
      return r.json()
    })
    .then((data) => {
      cache = data
      return data
    })
    .finally(() => {
      inflight = null
    })
  return inflight
}

// Merge JSON metadata + display config for a single language.
function buildLL(slug, raw, lang) {
  const display = LL_DISPLAY[slug]
  const content = raw[lang] || raw.en
  return {
    slug,
    num: display.num,
    region: LL_REGION[slug]?.[lang] || LL_REGION[slug]?.en || '',
    color: display.color,
    colorDark: display.colorDark,
    ...display.kpi,
    name: content.name,
    tagline: content.tagline,
    nuts3: raw.nuts3,
    contact: raw.contact,
    mock: raw.mock,
    content,
  }
}

// Returns { lls, bySlug, loading, error } — a list in display order plus a slug index.
export function useLLMetadata(lang = 'en') {
  const [state, setState] = useState({ lls: null, bySlug: null, loading: true, error: null })

  useEffect(() => {
    let cancelled = false
    fetchMetadata()
      .then((data) => {
        if (cancelled) return
        const lls = LL_ORDER.filter((slug) => data[slug]).map((slug) => buildLL(slug, data[slug], lang))
        const bySlug = Object.fromEntries(lls.map((ll) => [ll.slug, ll]))
        setState({ lls, bySlug, loading: false, error: null })
      })
      .catch((error) => {
        if (cancelled) return
        setState({ lls: null, bySlug: null, loading: false, error })
      })
    return () => {
      cancelled = true
    }
  }, [lang])

  return state
}
