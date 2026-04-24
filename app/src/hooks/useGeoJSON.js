import { useEffect, useState } from 'react'

const cache = new Map()
const inflight = new Map()

function fetchOne(url) {
  if (cache.has(url)) return Promise.resolve(cache.get(url))
  if (inflight.has(url)) return inflight.get(url)
  const p = fetch(url)
    .then((r) => {
      if (!r.ok) throw new Error(`Failed to load ${url}: ${r.status}`)
      return r.json()
    })
    .then((data) => {
      cache.set(url, data)
      inflight.delete(url)
      return data
    })
    .catch((err) => {
      inflight.delete(url)
      throw err
    })
  inflight.set(url, p)
  return p
}

// Fetch one or more GeoJSON files in parallel and return them in the same order.
// Pass a string for a single URL; it will still be returned in an array for consistency.
export function useGeoJSON(urls) {
  const key = Array.isArray(urls) ? urls.join('|') : urls
  const [state, setState] = useState({ data: null, loading: true, error: null })

  useEffect(() => {
    let cancelled = false
    const list = Array.isArray(urls) ? urls : [urls]
    Promise.all(list.map(fetchOne))
      .then((data) => {
        if (cancelled) return
        setState({ data, loading: false, error: null })
      })
      .catch((error) => {
        if (cancelled) return
        setState({ data: null, loading: false, error })
      })
    return () => {
      cancelled = true
    }
    // key is a stable string derived from urls
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return state
}
