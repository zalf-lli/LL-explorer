// Lightweight equal-area-ish projection used by the Landing SVG map.
// Real mapping (Phase 3) runs inside Leaflet with EPSG:3857; this helper is
// only for the static overview map on the landing page.
//
// We compute a single cosLat factor at the centre latitude of the bbox and use
// it to scale longitude — good enough for Germany's small latitude span.

import { walkCoords } from './geojson.js'

export function featuresBbox(features) {
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  for (const f of features) {
    walkCoords(f.geometry.coordinates, (x, y) => {
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    })
  }
  return { minX, maxX, minY, maxY }
}

export function buildProjection(bbox, svgW, svgH, pad = 16) {
  const cosLat = Math.cos(((bbox.minY + bbox.maxY) / 2) * (Math.PI / 180))
  const pMinX = bbox.minX * cosLat
  const pMaxX = bbox.maxX * cosLat
  const pMinY = -bbox.maxY
  const pMaxY = -bbox.minY
  const dataW = pMaxX - pMinX
  const dataH = pMaxY - pMinY
  const scale = Math.min((svgW - 2 * pad) / dataW, (svgH - 2 * pad) / dataH)
  const offsetX = (svgW - dataW * scale) / 2
  const offsetY = (svgH - dataH * scale) / 2
  return (lon, lat) => [
    (lon * cosLat - pMinX) * scale + offsetX,
    (-lat - pMinY) * scale + offsetY,
  ]
}

export function featuresCentroid(features, project) {
  let sx = 0
  let sy = 0
  let n = 0
  for (const f of features) {
    walkCoords(f.geometry.coordinates, (x, y) => {
      const [px, py] = project(x, y)
      sx += px
      sy += py
      n++
    })
  }
  return [sx / n, sy / n]
}
