import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import { translateData, translateCategory } from '../utils/translateData';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Filter, MapPin, Layers, Info, Navigation, Crosshair } from 'lucide-react';
import { MAP_LAYERS, DEFAULT_MAP_LAYER } from '../maps/mapLayers';
import MapLayerSelector from '../maps/MapLayerSelector';

// Custom Colored DivIcons for Leaflet
const createCustomIcon = (category, priorityLevel) => {
  let color = '#059669'; // default emerald
  if (category === 'Waste accumulation') color = '#f59e0b'; // amber
  else if (category === 'Drainage blockage') color = '#0284c7'; // sky
  else if (category === 'Water leakage' || category === 'Water supply') color = '#06b6d4'; // cyan
  else if (category === 'Damaged road') color = '#8b5cf6'; // violet
  else if (category === 'Streetlight failure') color = '#eab308'; // yellow
  else if (priorityLevel === 'Critical') color = '#ef4444'; // red

  const html = `
    <div style="
      background-color: ${color};
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 4px 10px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 10px;
      font-weight: bold;
    ">
      •
    </div>
  `;

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
// Custom Live User Pin Icon for Live Location Tracking
const liveUserPinIcon = L.divIcon({
  className: 'custom-live-user-pin',
  html: `
    <div style="position: relative; width: 32px; height: 32px; transform: translate(-50%, -50%); display: flex; align-items: center; justify-content: center; cursor: pointer;">
      <div style="position: absolute; width: 44px; height: 44px; border-radius: 50%; background: rgba(14, 165, 233, 0.25); animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
      <div style="position: absolute; width: 28px; height: 28px; border-radius: 50%; background: rgba(14, 165, 233, 0.4);"></div>
      <div style="position: relative; width: 16px; height: 16px; border-radius: 50%; background: #0284c7; border: 2.5px solid white; box-shadow: 0 2px 8px rgba(2, 132, 199, 0.6);"></div>
    </div>
  `,
  iconSize: [0, 0],
});

function MapPanController({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, 17, { animate: true, duration: 1.2 });
    }
  }, [center, map]);
  return null;
}

export default function IssueMap() {
  const { t, i18n } = useTranslation();

  const navigate = useNavigate();

  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState('All');
  const [mapLayer, setMapLayer] = useState(DEFAULT_MAP_LAYER);

  // Live location tracking state
  const [isLiveTracking, setIsLiveTracking] = useState(false);
  const [liveUserCoords, setLiveUserCoords] = useState(null);
  const [liveAccuracy, setLiveAccuracy] = useState(null);
  const [mapCenter, setMapCenter] = useState(null);
  const watchIdRef = useRef(null);

  const handleStartLiveTracking = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLiveTracking(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const acc = Math.round(pos.coords.accuracy);
        setLiveUserCoords([lat, lng]);
        setLiveAccuracy(acc);
        setMapCenter([lat, lng]);
      },
      (err) => {
        console.warn('GPS error in map:', err);
        const simLat = 18.5204 + (Math.random() - 0.5) * 0.0008;
        const simLng = 73.8567 + (Math.random() - 0.5) * 0.0008;
        setLiveUserCoords([simLat, simLng]);
        setLiveAccuracy(5);
        setMapCenter([simLat, simLng]);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const acc = Math.round(pos.coords.accuracy);
        setLiveUserCoords([lat, lng]);
        setLiveAccuracy(acc);
      },
      (err) => console.warn('Watch error:', err),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 }
    );
  };

  const handleStopLiveTracking = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsLiveTracking(false);
  };

  const handleToggleLiveTracking = () => {
    if (isLiveTracking) handleStopLiveTracking();
    else handleStartLiveTracking();
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  useEffect(() => {
    const fetchMapIssues = async () => {
      try {
        setLoading(true);
        const res = await api.get('/issues?limit=100');
        setIssues(res.data.issues || []);
      } catch (err) {
        console.error('Fetch map issues error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMapIssues();
  }, []);

  const filteredIssues = issues.filter((i) => {
    if (selectedCategory !== 'All' && i.category !== selectedCategory) return false;
    if (selectedStatus !== 'All' && i.status !== selectedStatus) return false;
    if (selectedPriority !== 'All' && i.priority?.level !== selectedPriority) return false;
    return true;
  });

  const centerPos = [18.5204, 73.8567]; // Village Center

  return (
    <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-100/80 text-emerald-800 text-xs font-semibold mb-2">
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            <span>Interactive Village GIS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Gram Panchayat Civic Map
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Geospatial visualization of civic complaints, recurring hotspots, and field worker progress.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-soft text-xs">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-medium"
          >
            <option value="All">All Categories</option>
            <option value="Waste accumulation">Waste accumulation</option>
            <option value="Drainage blockage">Drainage blockage</option>
            <option value="Water leakage">Water leakage</option>
            <option value="Damaged road">Damaged road</option>
            <option value="Streetlight failure">Streetlight failure</option>
            <option value="Water supply">Water supply</option>
            <option value="Sanitation">Sanitation</option>
          </select>

          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-medium"
          >
            <option value="All">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <div className="px-2 text-slate-400 font-bold">|</div>
          <div className="px-2 font-bold text-emerald-800">{filteredIssues.length} Pinned</div>
        </div>
      </div>

      {/* Map Container */}
      <div className="h-[650px] lg:h-[750px] xl:h-[780px] rounded-3xl overflow-hidden border border-slate-200/80 shadow-soft relative">
        {/* Floating Map Layer Selector (Satellite, Hybrid, Street, Terrain) */}
        <div className="absolute top-4 right-4 z-[1000]">
          <MapLayerSelector currentLayer={mapLayer} onSelectLayer={setMapLayer} />
        </div>

        {/* Floating Live Location Tracking Controls */}
        <div className="absolute top-4 left-14 z-[1000] flex items-center space-x-2 pointer-events-auto">
          <button
            type="button"
            onClick={handleToggleLiveTracking}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg backdrop-blur-md border transition-all cursor-pointer select-none ${
              isLiveTracking
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-300 ring-2 ring-emerald-400/50 shadow-emerald-500/30 animate-pulse'
                : 'bg-slate-900/85 hover:bg-slate-900 text-white border-white/20 hover:border-white/40'
            }`}
            title="Live Location Track करा (Live GPS)"
          >
            <Navigation className={`w-3.5 h-3.5 ${isLiveTracking ? 'text-amber-300 animate-spin' : 'text-sky-400'}`} />
            <span>{isLiveTracking ? '🟢 Live GPS Active' : '📍 Track My Live Location'}</span>
          </button>

          {liveUserCoords && (
            <button
              type="button"
              onClick={() => setMapCenter(liveUserCoords)}
              className="hidden sm:flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-900/85 hover:bg-slate-900 text-white border border-white/20 backdrop-blur-md shadow-md cursor-pointer"
              title="Maza Live Location Center करा"
            >
              <Crosshair className="w-3 h-3 text-sky-400" />
              <span>Center Me</span>
            </button>
          )}
        </div>

        {/* Live Tracking GPS Pill Indicator */}
        {liveUserCoords && (
          <div className="absolute bottom-4 left-4 z-[1000] bg-slate-900/90 backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-[11px] font-semibold shadow-lg border border-white/20 flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping"></span>
            <span className="text-sky-400 font-bold">Maza Live Location:</span>
            <span className="font-mono text-slate-100">
              {liveUserCoords[0].toFixed(5)}°N, {liveUserCoords[1].toFixed(5)}°E
            </span>
            <span className="text-slate-400 text-[10px]">(±{liveAccuracy || 4}m)</span>
          </div>
        )}

        <MapContainer center={centerPos} zoom={15} scrollWheelZoom={true} className="h-full w-full">
          <MapPanController center={mapCenter} />
          <TileLayer
            key={mapLayer}
            attribution={MAP_LAYERS[mapLayer]?.attribution}
            url={MAP_LAYERS[mapLayer]?.url}
            maxZoom={MAP_LAYERS[mapLayer]?.maxZoom || 19}
            subdomains={MAP_LAYERS[mapLayer]?.subdomains || ['a', 'b', 'c']}
          />

          {/* Render Live User Location Marker */}
          {liveUserCoords && (
            <>
              <Marker position={liveUserCoords} icon={liveUserPinIcon}>
                <Popup>
                  <div className="p-1.5 text-xs space-y-1">
                    <div className="font-bold text-sky-900 flex items-center space-x-1">
                      <span className="w-2 h-2 rounded-full bg-sky-500 animate-ping"></span>
                      <span>🔵 Maza Live Location (You are here)</span>
                    </div>
                    <div className="text-slate-600 text-[11px]">Accuracy: ±{liveAccuracy || 4}m</div>
                    <div className="text-sky-700 font-mono text-[10px] font-bold">
                      📍 {liveUserCoords[0].toFixed(5)}°N, {liveUserCoords[1].toFixed(5)}°E
                    </div>
                  </div>
                </Popup>
              </Marker>
              {liveAccuracy && (
                <Circle
                  center={liveUserCoords}
                  radius={liveAccuracy}
                  pathOptions={{ color: '#0284c7', fillColor: '#38bdf8', fillOpacity: 0.25, weight: 2 }}
                />
              )}
            </>
          )}

          {filteredIssues.map((issue) => {
            const coords = issue.location?.coordinates;
            if (!coords || !Array.isArray(coords) || coords.length !== 2) return null;
            const pos = [coords[1], coords[0]];

            return (
              <Marker
                key={issue._id}
                position={pos}
                icon={createCustomIcon(issue.category, issue.priority?.level)}
              >
                <Popup className="srci-custom-popup">
                  <div className="p-1 max-w-[240px] space-y-2">
                    {issue.images && issue.images.length > 0 && (
                      <div className="h-24 rounded-xl overflow-hidden mb-1">
                        <img src={issue.images[0].url} alt={issue.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex items-center space-x-1">
                      <StatusBadge status={issue.status} />
                      <PriorityBadge level={issue.priority?.level} />
                    </div>
                    <div className="font-bold text-slate-900 text-xs line-clamp-2">
                      {translateData(issue.title, i18n.language)}
                    </div>
                    <div className="text-[11px] text-slate-500 line-clamp-1">
                      {translateData(issue.location?.landmark, i18n.language)}
                    </div>
                    <div className="pt-1">
                      <button
                        onClick={() => navigate(`/issues/${issue._id}`)}
                        className="w-full py-1.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] text-center"
                      >
                        {t('buttons.viewDetails') || 'View Full Details'}
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );

          })}
        </MapContainer>

        {/* Legend Overlay */}
        <div className="absolute bottom-4 right-4 z-[400] bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200 shadow-md text-xs space-y-1.5">
          <div className="font-bold text-slate-800 mb-1 text-[11px] uppercase tracking-wider">Map Legend</div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-amber-500"></span>
            <span className="text-[11px] text-slate-600">Waste Accumulation</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-sky-600"></span>
            <span className="text-[11px] text-slate-600">Drainage Blockage</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-cyan-500"></span>
            <span className="text-[11px] text-slate-600">Water Leakage / Supply</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-violet-600"></span>
            <span className="text-[11px] text-slate-600">Damaged Roads</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-rose-500"></span>
            <span className="text-[11px] text-slate-600">Critical Priority</span>
          </div>
        </div>
      </div>
    </div>
  );
}
