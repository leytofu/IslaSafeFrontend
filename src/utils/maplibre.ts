import type { FeatureCollection, GeoJsonProperties, Geometry } from 'geojson'
import type { GeoJSONSource, LngLatBoundsLike, LngLatLike, Map as MapLibreMap, RasterTileSource, StyleSpecification } from 'maplibre-gl'

/** Coordinates are stored across the application as [latitude, longitude]. */
export type MapCoordinate = [number, number]

export function toLngLat([latitude, longitude]: MapCoordinate): LngLatLike {
  return [longitude, latitude]
}

export function toLngLatBounds([[south, west], [north, east]]: [MapCoordinate, MapCoordinate]): LngLatBoundsLike {
  return [[west, south], [east, north]]
}

export function createRasterStyle(tileUrl: string, attribution: string, maxZoom: number): StyleSpecification {
  return {
    version: 8,
    sources: {
      'islasafe-basemap': {
        attribution,
        maxzoom: maxZoom,
        tileSize: 256,
        tiles: [normalizeTileUrl(tileUrl)],
        type: 'raster',
      },
    },
    layers: [{ id: 'islasafe-basemap', source: 'islasafe-basemap', type: 'raster' }],
  }
}

export function updateRasterTiles(map: MapLibreMap, tileUrl: string) {
  const source = map.getSource('islasafe-basemap')
  if (source) {
    ;(source as RasterTileSource).setTiles([normalizeTileUrl(tileUrl)])
    map.triggerRepaint()
  }
}

// Map tile sources require a concrete hostname. Retain existing environment values
// while using the first subdomain when a `{s}` placeholder is supplied.
function normalizeTileUrl(tileUrl: string) {
  return tileUrl.replace('{s}', 'a')
}

export function setGeoJsonData(map: MapLibreMap, sourceId: string, data: FeatureCollection<Geometry, GeoJsonProperties>) {
  const source = map.getSource(sourceId)
  if (source) {
    ;(source as GeoJSONSource).setData(data)
    return
  }

  map.addSource(sourceId, { data, type: 'geojson' })
}

export function setLayerVisibility(map: MapLibreMap, layerId: string, visible: boolean) {
  if (map.getLayer(layerId)) map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none')
}

export function createCirclePolygon(center: MapCoordinate, radiusInMeters: number, steps = 48): number[][] {
  const [latitude, longitude] = center
  const angularDistance = radiusInMeters / 6_371_008.8
  const latitudeRadians = latitude * Math.PI / 180
  const longitudeRadians = longitude * Math.PI / 180
  const ring: number[][] = []

  for (let index = 0; index <= steps; index += 1) {
    const bearing = index / steps * Math.PI * 2
    const nextLatitude = Math.asin(Math.sin(latitudeRadians) * Math.cos(angularDistance) + Math.cos(latitudeRadians) * Math.sin(angularDistance) * Math.cos(bearing))
    const nextLongitude = longitudeRadians + Math.atan2(Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(latitudeRadians), Math.cos(angularDistance) - Math.sin(latitudeRadians) * Math.sin(nextLatitude))
    ring.push([nextLongitude * 180 / Math.PI, nextLatitude * 180 / Math.PI])
  }

  return ring
}
