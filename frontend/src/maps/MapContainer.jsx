import React, { useState } from 'react';
import { MapContainer as LeafletMap, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { MAP_LAYERS, DEFAULT_MAP_LAYER } from './mapLayers';
import MapLayerSelector from './MapLayerSelector';

export default function MapContainer({
  center = [18.5204, 73.8567],
  zoom = 13,
  markers = [],
  height = '400px',
  initialLayer = DEFAULT_MAP_LAYER,
}) {
  const [mapLayer, setMapLayer] = useState(initialLayer);

  return (
    <div style={{ height, width: '100%' }} className="relative rounded-2xl overflow-hidden shadow-inner border border-slate-200">
      {/* Floating Layer Selector */}
      <div className="absolute top-3 right-3 z-[1000]">
        <MapLayerSelector currentLayer={mapLayer} onSelectLayer={setMapLayer} />
      </div>

      <LeafletMap center={center} zoom={zoom} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          key={mapLayer}
          attribution={MAP_LAYERS[mapLayer]?.attribution}
          url={MAP_LAYERS[mapLayer]?.url}
          maxZoom={MAP_LAYERS[mapLayer]?.maxZoom || 19}
          subdomains={MAP_LAYERS[mapLayer]?.subdomains || ['a', 'b', 'c']}
        />
        {markers.map((marker, idx) => (
          <Marker key={idx} position={[marker.lat, marker.lng]}>
            {marker.title && (
              <Popup>
                <div className="text-sm">
                  <div className="font-bold">{marker.title}</div>
                  {marker.description && <p className="text-xs text-slate-600 mt-1">{marker.description}</p>}
                </div>
              </Popup>
            )}
          </Marker>
        ))}
      </LeafletMap>
    </div>
  );
}
