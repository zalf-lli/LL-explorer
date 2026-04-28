import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import L from 'leaflet'
import { GeoJSON, MapContainer, TileLayer } from 'react-leaflet'
import { useMap } from 'react-leaflet/hooks'
import { PMTiles, leafletRasterLayer } from 'pmtiles'
import { useGeoJSON } from '../../hooks/useGeoJSON.js'
import { LAYER_INDEX } from '../../data/layers.js'
import { LAYER_SOURCE_INDEX } from '../../data/layer_sources.js'
import { getLLOutlineColor } from '../../data/ll_display.js'
import { buildMaskFeature } from '../../lib/buildMaskGeometry.js'
import { C } from '../../theme.js'
import { MapLegend } from '../MapLegend.jsx'

const MAP_STYLE = { width: '100%', height: '100%' }
const TILE_SUBDOMAINS = ['a', 'b', 'c', 'd']
const PMTILES_CACHE = new Map()

const BASEMAP_SOURCE = {
  provider: 'OpenStreetMap contributors',
  dataset: 'CARTO Voyager basemap',
  url: 'https://www.openstreetmap.org/copyright',
  license: 'ODbL / CC BY 3.0',
}

const MASK_STYLE = {
  fillColor: '#ffffff',
  fillOpacity: 0.6,
  stroke: false,
  interactive: false,
}

function getPmtiles(url) {
  if (!PMTILES_CACHE.has(url)) {
    PMTILES_CACHE.set(url, new PMTiles(url))
  }
  return PMTILES_CACHE.get(url)
}

function selectBoundary(collections, slug) {
  const source = Array.isArray(collections) ? collections[0] : null
  if (!source?.features?.length) return null
  return source.features.find((f) => f.properties?.ll_slug === slug) ?? null
}

function getBounds(featureLike) {
  const bounds = L.geoJSON(featureLike).getBounds()
  return bounds.isValid() ? bounds : null
}

function RasterPmtilesLayer({ layerId }) {
  const map = useMap()
  const layerConfig = LAYER_INDEX.get(layerId)

  useEffect(() => {
    if (!layerConfig?.pmtilesUrl) return undefined
    const overlay = leafletRasterLayer(getPmtiles(layerConfig.pmtilesUrl), {
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

function InfoRow({ label, primary, provider, license, url, viewSourceLabel, licenseLabel }) {
  return (
    <div>
      <div
        style={{
          fontSize: 9.5,
          fontWeight: 700,
          color: C.greenMid,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          marginBottom: 2,
        }}
      >
        {label}
      </div>
      <div style={{ fontWeight: 700 }}>{primary}</div>
      {provider ? <div style={{ color: C.green }}>{provider}</div> : null}
      {license ? (
        <div style={{ color: C.muted }}>
          {licenseLabel}: {license}
        </div>
      ) : null}
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: C.orange, fontWeight: 700, textDecoration: 'none' }}
        >
          {viewSourceLabel} →
        </a>
      ) : null}
    </div>
  )
}

function MapInfoControl({ layer }) {
  const { t, i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef(null)
  const layerSource = LAYER_SOURCE_INDEX.get(layer) ?? null
  const layerConfig = LAYER_INDEX.get(layer)
  const showLayerRow = Boolean(layerConfig?.available && layerSource)

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    const onPointer = (e) => {
      if (!wrapperRef.current) return
      if (!wrapperRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onPointer)
    }
  }, [open])

  const lang = i18n.language?.startsWith('de') ? 'de' : 'en'
  const layerTitle = layerSource
    ? layerSource.title?.[lang] || layerSource.title?.en || layerSource.dataset
    : ''

  return (
    <div
      ref={wrapperRef}
      onMouseEnter={() => setOpen(true)}
      style={{
        position: 'absolute',
        bottom: 8,
        right: 8,
        zIndex: 500,
      }}
    >
      <button
        type="button"
        aria-label={t('map.info.tooltip')}
        aria-expanded={open}
        title={t('map.info.tooltip')}
        onClick={() => setOpen((o) => !o)}
        onFocus={() => setOpen(true)}
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          border: `1px solid ${C.mutedLight}`,
          background: 'rgba(255,255,255,0.95)',
          color: C.teal,
          fontWeight: 800,
          fontSize: 14,
          fontFamily: 'inherit',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 6px rgba(2,35,34,0.15)',
        }}
      >
        i
      </button>
      {open ? (
        <div
          role="dialog"
          aria-label={t('map.info.tooltip')}
          style={{
            position: 'absolute',
            right: 0,
            bottom: 36,
            width: 280,
            padding: '10px 12px',
            background: 'rgba(255,255,255,0.98)',
            borderRadius: 8,
            border: `1px solid ${C.mutedLight}`,
            boxShadow: '0 6px 18px rgba(2,35,34,0.18)',
            color: C.teal,
            fontSize: 11.5,
            lineHeight: 1.45,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <InfoRow
            label={t('map.info.basemap')}
            primary={BASEMAP_SOURCE.dataset}
            provider={BASEMAP_SOURCE.provider}
            license={BASEMAP_SOURCE.license}
            url={BASEMAP_SOURCE.url}
            viewSourceLabel={t('map.info.viewSource')}
            licenseLabel={t('map.info.license')}
          />
          {showLayerRow ? (
            <InfoRow
              label={t('map.info.dataSource')}
              primary={layerTitle}
              provider={layerSource.provider}
              license={layerSource.license}
              url={layerSource.url}
              viewSourceLabel={t('map.info.viewSource')}
              licenseLabel={t('map.info.license')}
            />
          ) : (
            <div style={{ color: C.muted, fontStyle: 'italic' }}>{t('map.info.noSource')}</div>
          )}
        </div>
      ) : null}
    </div>
  )
}

export default function LLMap({ ll, layer, height = 300 }) {
  const { t } = useTranslation()
  const layerConfig = LAYER_INDEX.get(layer)
  const { data, loading, error } = useGeoJSON('data/ll_boundaries.geojson')

  const boundaryFeature = useMemo(() => selectBoundary(data, ll.slug), [data, ll.slug])
  const bounds = useMemo(() => (boundaryFeature ? getBounds(boundaryFeature) : null), [boundaryFeature])
  const maskFeature = useMemo(
    () => (layerConfig?.available ? buildMaskFeature(boundaryFeature) : null),
    [boundaryFeature, layerConfig?.available],
  )
  const outlineColor = useMemo(() => getLLOutlineColor(ll.slug), [ll.slug])
  const outlineStyle = useMemo(
    () => ({ color: outlineColor, weight: 2.5, fill: false }),
    [outlineColor],
  )

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

  if (error || !boundaryFeature || !bounds) {
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
          attributionControl={false}
          bounds={bounds}
          boundsOptions={{ padding: [16, 16] }}
          scrollWheelZoom
          style={MAP_STYLE}
        >
          <TileLayer
            maxZoom={19}
            subdomains={TILE_SUBDOMAINS}
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          {layerConfig?.available ? <RasterPmtilesLayer layerId={layer} /> : null}
          {maskFeature ? <GeoJSON key={`mask-${ll.slug}`} data={maskFeature} style={MASK_STYLE} /> : null}
          <GeoJSON key={`outline-${ll.slug}-${outlineColor}`} data={boundaryFeature} style={outlineStyle} />
        </MapContainer>
        {layerConfig?.available ? null : <ComingSoonBadge />}
        <MapInfoControl layer={layer} />
      </div>
      <div style={{ padding: '10px 16px', borderTop: `1px solid ${C.mutedLight}`, background: C.bg }}>
        <MapLegend layer={layer} />
      </div>
    </div>
  )
}
