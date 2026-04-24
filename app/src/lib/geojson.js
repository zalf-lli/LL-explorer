// GeoJSON → SVG path helpers. Used by the Landing overview map to render
// NUTS-1 (states) and NUTS-3 (LL regions) as plain SVG paths.

export function walkCoords(coords, cb) {
  if (typeof coords[0] === 'number') {
    cb(coords[0], coords[1])
    return
  }
  for (const c of coords) walkCoords(c, cb)
}

function ringToPath(ring, project) {
  return (
    ring
      .map((pt, i) => {
        const [x, y] = project(pt[0], pt[1])
        return (i === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1)
      })
      .join(' ') + ' Z'
  )
}

export function featureToPath(feature, project) {
  const g = feature.geometry
  if (g.type === 'Polygon') return g.coordinates.map((r) => ringToPath(r, project)).join(' ')
  if (g.type === 'MultiPolygon')
    return g.coordinates.map((p) => p.map((r) => ringToPath(r, project)).join(' ')).join(' ')
  return ''
}
