// Build an inverse polygon mask: a world-spanning outer ring with every outer
// ring of the input LL geometry punched out as a hole on the SAME polygon.
// Rendered as a GeoJSON layer it visually de-emphasises everything outside
// the selected Living Lab.
//
// Accepts a GeoJSON feature whose geometry is a Polygon or MultiPolygon.
// All outer rings (one for Polygon, N for MultiPolygon) become holes on a
// single output polygon. Putting every part on one polygon — instead of one
// mask polygon per part — is essential for non-contiguous LLs: otherwise
// each per-part mask covers the *other* parts, and the inside of every part
// ends up filled. (Interior holes inside the LL geometry are intentionally
// ignored: they represent areas outside the LL and should stay masked.)

// Web Mercator-safe rectangular ring covering the displayed world.
// Using a wide rectangle (rather than [-180,180]) keeps the mask stable when
// the Leaflet view crosses the antimeridian or zooms out further than expected.
const WORLD_RING = [
  [-360, -85],
  [360, -85],
  [360, 85],
  [-360, 85],
  [-360, -85],
]

function outerRingsOf(geometry) {
  if (!geometry) return []
  if (geometry.type === 'Polygon') {
    const ring = geometry.coordinates?.[0]
    return ring && ring.length ? [ring] : []
  }
  if (geometry.type === 'MultiPolygon') {
    return (geometry.coordinates || [])
      .map((polygon) => polygon?.[0])
      .filter((ring) => ring && ring.length)
  }
  return []
}

export function buildMaskFeature(boundaryFeature) {
  const rings = outerRingsOf(boundaryFeature?.geometry)
  if (!rings.length) return null

  return {
    type: 'Feature',
    properties: { role: 'll-outside-mask' },
    geometry: {
      type: 'Polygon',
      coordinates: [WORLD_RING, ...rings],
    },
  }
}
