import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import L from 'leaflet'
import { GeoJSON, MapContainer, TileLayer } from 'react-leaflet'
import { useMap } from 'react-leaflet/hooks'
import { PMTiles, leafletRasterLayer } from 'pmtiles'
import { useGeoJSON } from '../../hooks/useGeoJSON.js'
import { LAYER_INDEX } from '../../data/layers.js'
import { C } from '../../theme.js'
import { MapLegend } from '../MapLegend.jsx'

const MAP_STYLE = { width: '100%', height: '100%' }
const OUTLINE_STYLE = { color: C.orange, weight: 2.5, fill: false }
const TILE_SUBDOMAINS = ['a', 'b', 'c', 'd']
const PMTILES_CACHE = new Map()

function getPmtiles(url) {
  if (!PMTILES_CACHE.has(url)) {
    PMTILES_CACHE.set(url, new PMTiles(url))
  }
  return PMTILES_CACHE.get(url)
}

function selectFeatureCollection(collections, nuts3) {
  const source = Array.isArray(collections) ? collections[0] : null
  if (!source?.features?.length) return null
  const keep = new Set(nuts3)
  const features = source.features.filter((feature) => keep.has(feature.properties?.NUTS_ID))
  return features.length ? { ...source, features } : null
}

function getBounds(featureCollection) {
  const bounds = L.geoJSON(featureCollection).getBounds()
  return bounds.isValid() ? bounds : null
}

function RasterPmtilesLayer({ layerId }) {
  const map = useMap()
  const layerConfig = LAYER_INDEX.get(layerId)

  useEffect(() => {
    if (!layerConfig?.pmtilesUrl) return undefined
    const overlay = leafletRasterLayer(getPmtiles(layerConfig.pmtilesUrl), {
      attribution: '(c) DLR (2024), CC BY 4.0',
      opacity: 0.85,
    })
    overlay.addTo(map)
    return () => {
      map.removeLayer(overlay)
    }
  }, [layerConfig, map])

  return null
}

function StatusMap({ layerId, slug, message }) {
  const { t } = useTranslation()
  return (
    <div
      style={{
        flex: 1,
        background: `linear-gradient(135deg, ${C.surface} 0%, ${C.surfaceDark} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 10,
        color: C.green,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: C.greenMid,
          textTransform: 'uppercase',
          letterSpacing: '0.14em',
        }}
      >
        {t(`layers.${layerId}`)} - {slug}
      </div>
      <div style={{ fontSize: 13, color: C.muted, fontStyle: 'italic' }}>{message}</div>
    </div>
  )
}

function ComingSoonBadge() {
  const { t } = useTranslation()
  return (
    <div
      style={{
        position: 'absolute',
        top: 12,
        right: 12,
        zIndex: 500,
        padding: '6px 10px',
        borderRadius: 999,
        background: 'rgba(255,255,255,0.92)',
        border: `1px solid ${C.mutedLight}`,
        color: C.teal,
        fontSize: 11,
        fontWeight: 700,
        boxShadow: '0 4px 12px rgba(2,35,34,0.08)',
      }}
    >
      {t('map.layerComingSoon')}
    </div>
  )
}

export default function LLMap({ ll, layer, height = 300 }) {
  const { t } = useTranslation()
  const layerConfig = LAYER_INDEX.get(layer)
  const { data, loading, error } = useGeoJSON('data/nuts3_ll_simplified.geojson')

  const featureCollection = useMemo(() => selectFeatureCollection(data, ll.nuts3), [data, ll.nuts3])
  const bounds = useMemo(() => (featureCollection ? getBounds(featureCollection) : null), [featureCollection])

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height }}>
        <StatusMap layerId={layer} slug={ll.slug} message={t('common.loadingMap')} />
        <div style={{ padding: '10px 16px', borderTop: `1px solid ${C.mutedLight}`, background: C.bg }}>
          <MapLegend layer={layer} />
        </div>
      </div>
    )
  }

  if (error || !featureCollection || !bounds) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height }}>
        <StatusMap layerId={layer} slug={ll.slug} message={t('map.loadError')} />
        <div style={{ padding: '10px 16px', borderTop: `1px solid ${C.mutedLight}`, background: C.bg }}>
          <MapLegend layer={layer} />
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height }}>
      <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
        <MapContainer
          key={ll.slug}
          bounds={bounds}
          boundsOptions={{ padding: [16, 16] }}
          scrollWheelZoom
          style={MAP_STYLE}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors &copy; CARTO"
            maxZoom={19}
            subdomains={TILE_SUBDOMAINS}
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          {layerConfig?.available ? <RasterPmtilesLayer layerId={layer} /> : null}
          <GeoJSON data={featureCollection} style={OUTLINE_STYLE} />
        </MapContainer>
        {layerConfig?.available ? null : <ComingSoonBadge />}
      </div>
      <div style={{ padding: '10px 16px', borderTop: `1px solid ${C.mutedLight}`, background: C.bg }}>
        <MapLegend layer={layer} />
      </div>
    </div>
  )
}
