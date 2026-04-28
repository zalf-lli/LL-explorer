import { LANDUSE_LEGEND } from './landuse_legend.js'

export const LAYERS = [
  {
    id: 'landuse',
    pmtilesUrl: 'data/pmtiles/landuse-croptypes.pmtiles',
    legend: LANDUSE_LEGEND,
    available: true,
  },
  { id: 'climate', pmtilesUrl: null, legend: null, available: false },
  { id: 'soil', pmtilesUrl: null, legend: null, available: false },
  { id: 'economic', pmtilesUrl: null, legend: null, available: false },
]

export const LAYER_INDEX = new Map(LAYERS.map((layer) => [layer.id, layer]))

export const LAYER_COLORS = {
  landuse: { arable: '#c2e077', forest: '#276d4e', grassland: '#83d2af', settlement: '#b5ad9e', water: '#8ffffc' },
  climate: { arable: '#f9d1c2', forest: '#daf1e7', grassland: '#fce3da', settlement: '#f2f8e2', water: '#bdfffd' },
  soil: { arable: '#d4b483', forest: '#8a6a3e', grassland: '#c4a870', settlement: '#a09080', water: '#8ffffc' },
  economic: { arable: '#9bc72d', forest: '#225e43', grassland: '#5ec597', settlement: '#dc4b14', water: '#00b3ad' },
}
