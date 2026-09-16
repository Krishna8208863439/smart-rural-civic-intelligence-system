import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import { translateData, translateCategory } from '../utils/translateData';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Filter,
  MapPin,
  Layers,
  Info,
  Navigation,
  Crosshair,
  Clock,
  Search,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Eye,
  ShieldCheck,
} from 'lucide-react';
import { MAP_LAYERS, DEFAULT_MAP_LAYER } from '../maps/mapLayers';
import MapLayerSelector from '../maps/MapLayerSelector';
import { getAccurateLivePosition, reverseGeocodeCoords } from '../utils/geolocation';
import { formatShortTime, formatDate, getLiveIstString } from '../utils/formatDate';

// Custom Colored DivIcons for Leaflet Issues
const createCustomIcon = (category, priorityLevel) => {
  let color = '#059669'; // emerald
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
      box-shadow: 0 4px 10px rgba(0,0,0,0.35);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 10px;
      font-weight: bold;
      cursor: pointer;
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
  });
};

// Pulsing Live User Pin Icon for Real-time GPS Tracking
const liveUserPinIcon = L.divIcon({
  className: 'custom-live-user-pin',
  html: `
    <div style="position: relative; width: 34px; height: 34px; transform: translate(-50%, -50%); display: flex; align-items: center; justify-content: center; cursor: pointer;">
      <div style="position: absolute; width: 48px; height: 48px; border-radius: 50%; background: rgba(14, 165, 233, 0.35); animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
      <div style="position: absolute; width: 30px; height: 30px; border-radius: 50%; background: rgba(14, 165, 233, 0.5);"></div>
      <div style="position: relative; width: 18px; height: 18px; border-radius: 50%; background: #0284c7; border: 3px solid white; box-shadow: 0 2px 10px rgba(2, 132, 199, 0.8);"></div>
    </div>
  `,
  iconSize: [0, 0],
});

function MapPanController({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, 16, { animate: true, duration: 1.2 });
    }
  }, [center, map]);
  return null;
}

function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      if (onMapClick) onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
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

  // Real-time Ticking Clock State (IST)
  const [liveClock, setLiveClock] = useState(() => getLiveIstString().time);
  const [liveDate, setLiveDate] = useState(() => getLiveIstString().date);

  // Live Location State
  const [liveUserCoords, setLiveUserCoords] = useState(null);
  const [liveAccuracy, setLiveAccuracy] = useState(null);
  const [liveSource, setLiveSource] = useState('Detecting...');
  const [liveAddress, setLiveAddress] = useState('');
  const [isLiveTracking, setIsLiveTracking] = useState(false);
  const [mapCenter, setMapCenter] = useState(null);
  const [detectingGps, setDetectingGps] = useState(false);
  const [gpsStatusMsg, setGpsStatusMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchingLocation, setSearchingLocation] = useState(false);

  const watchIdRef = useRef(null);

  // Real-time ticking clock interval (updates every 1 second)
  useEffect(() => {
    const timer = setInterval(() => {
      const ist = getLiveIstString();
      setLiveClock(ist.time);
      setLiveDate(ist.date);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch all issues for the map
  useEffect(() => {
    const fetchMapIssues = async () => {
      try {
        setLoading(true);
        const res = await api.get('/issues?limit=150');
        setIssues(res.data.issues || []);
      } catch (err) {
        console.error('Fetch map issues error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMapIssues();
  }, []);

  // Auto-detect live location immediately on mount
  useEffect(() => {
    acquireLiveLocation(true);
    return () => {
      if (watchIdRef.current && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const acquireLiveLocation = async (isInitial = false) => {
    setDetectingGps(true);
    setGpsStatusMsg('Acquiring live accurate GPS location...');
    try {
      const result = await getAccurateLivePosition({
        defaultCoords: [16.73180, 73.90790],
        onStatusChange: (msg) => setGpsStatusMsg(msg),
      });

      const coords = [result.lat, result.lng];
      setLiveUserCoords(coords);
      setLiveAccuracy(result.accuracy);
      setLiveSource(result.source);
      setIsLiveTracking(true);

      if (isInitial || !mapCenter) {
        setMapCenter(coords);
      }

      if (result.addressData?.address) {
        setLiveAddress(result.addressData.address);
      }
    } catch (e) {
      console.warn('Auto live location note:', e);
      // Fallback Chandoli
      const fallback = [16.73180, 73.90790];
      setLiveUserCoords(fallback);
      setLiveAccuracy(10);
      setLiveSource('Chandoli Gram Panchayat Hub');
    } finally {
      setDetectingGps(false);
      setGpsStatusMsg('');
    }

    // Set up continuous watch
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
      try {
        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            const acc = Math.round(pos.coords.accuracy);
            setLiveUserCoords([lat, lng]);
            setLiveAccuracy(acc);
            setLiveSource(acc <= 25 ? 'High-Precision Live GPS' : 'Wi-Fi / Cellular Triangulation');
          },
          (err) => console.log('Watch note:', err.message),
          { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 }
        );
      } catch (e) {
        // ignore
      }
    }
  };

  const handleToggleLiveTracking = () => {
    if (isLiveTracking) {
      if (watchIdRef.current && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setIsLiveTracking(false);
    } else {
      acquireLiveLocation(false);
    }
  };

  // Click on map to place/adjust live pin
  const handleMapClick = async (lat, lng) => {
    const coords = [lat, lng];
    setLiveUserCoords(coords);
    setLiveAccuracy(2); // Manual precision ±2m
    setLiveSource('Interactive Map Pin Drop');
    try {
      const rev = await reverseGeocodeCoords(lat, lng);
      setLiveAddress(rev?.address || `Coordinates (${lat.toFixed(5)}°N, ${lng.toFixed(5)}°E)`);
    } catch (e) {
      setLiveAddress(`Coordinates (${lat.toFixed(5)}°N, ${lng.toFixed(5)}°E)`);
    }
  };

  // Quick village selector
  const handleQuickVillage = async (name, lat, lng) => {
    const coords = [lat, lng];
    setLiveUserCoords(coords);
    setMapCenter(coords);
    setLiveAccuracy(5);
    setLiveSource(`Village Hub (${name})`);
    try {
      const rev = await reverseGeocodeCoords(lat, lng);
      setLiveAddress(rev?.address || `${name}, Maharashtra, India`);
    } catch (e) {
      setLiveAddress(`${name}, Maharashtra, India`);
    }
  };

  // Search Village or Landmark via OpenStreetMap Nominatim
  const handleSearchSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearchingLocation(true);
    try {
      const q = encodeURIComponent(`${searchQuery.trim()}, Maharashtra, India`);
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${q}&limit=1`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SmartRuralCivicIntelligence/2.0',
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          const coords = [lat, lng];
          setLiveUserCoords(coords);
          setMapCenter(coords);
          setLiveAccuracy(4);
          setLiveSource(`Search: ${searchQuery}`);
          setLiveAddress(data[0].display_name);
        } else {
          alert(`Could not find "${searchQuery}". Try searching a major village or city (e.g. Chandoli, Devrai, Sangli, Kolhapur).`);
        }
      }
    } catch (err) {
      console.warn('Search error:', err);
    } finally {
      setSearchingLocation(false);
    }
  };

  const filteredIssues = issues.filter((i) => {
    if (selectedCategory !== 'All' && i.category !== selectedCategory) return false;
    if (selectedStatus !== 'All' && i.status !== selectedStatus) return false;
    if (selectedPriority !== 'All' && i.priority?.level !== selectedPriority) return false;
    return true;
  });

  const defaultCenter = liveUserCoords || [16.73180, 73.90790]; // Gram Panchayat Chandoli

  return (
    <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      {/* Real-Time Indian Standard Time (IST) Digital Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-md border border-slate-700/80">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0 shadow-inner">
            <Clock className="w-4 h-4 text-emerald-400 animate-pulse" />
          </div>
          <div>
            <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>100% Real-Time Indian Standard Time (IST)</span>
            </div>
            <div className="text-sm font-extrabold font-mono text-white tracking-wide">
              {liveDate} • {liveClock}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {liveUserCoords && (
            <div className="hidden md:flex items-center space-x-1.5 px-3 py-1 rounded-full bg-sky-500/20 border border-sky-500/40 text-sky-300 font-mono text-xs">
              <MapPin className="w-3.5 h-3.5 text-sky-400" />
              <span>
                Live GPS: {liveUserCoords[0].toFixed(5)}°N, {liveUserCoords[1].toFixed(5)}°E (±{liveAccuracy || 4}m)
              </span>
            </div>
          )}
          <span className="text-[11px] px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>Live Civic GIS Engine Active</span>
          </span>
        </div>
      </div>

      {/* Header & Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-100/80 text-emerald-800 text-xs font-semibold mb-1">
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            <span>Interactive Village GIS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Gram Panchayat Civic Map
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time geospatial tracking of civic complaints, recurring hotspots, and live citizen GPS position.
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
          <div className="px-2 font-bold text-emerald-800">{filteredIssues.length} Complaints Pinned</div>
        </div>
      </div>

      {/* Village Search Bar & Quick Village Buttons */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-soft space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search village, town, or landmark (e.g. Chandoli, Devrai, Shirala, Sangli, Kolhapur)..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
              />
            </div>
            <button
              type="submit"
              disabled={searchingLocation || !searchQuery.trim()}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 active:bg-black text-white shadow-xs transition cursor-pointer disabled:opacity-50 shrink-0"
            >
              {searchingLocation ? 'Searching...' : '🔍 Pin Village'}
            </button>
          </form>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => acquireLiveLocation(false)}
              disabled={detectingGps}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-60 shrink-0"
              title="Detect current GPS location"
            >
              <Navigation className={`w-3.5 h-3.5 ${detectingGps ? 'animate-spin' : ''}`} />
              <span>{detectingGps ? (gpsStatusMsg || 'Locating...') : '📍 Re-Detect Live GPS'}</span>
            </button>
          </div>
        </div>

        {/* Quick Village Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
          <span className="font-semibold text-slate-500 text-[11px]">Quick Village Teleport:</span>
          <button
            type="button"
            onClick={() => handleQuickVillage('Chandoli', 16.73180, 73.90790)}
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-semibold transition"
          >
            📍 Chandoli
          </button>
          <button
            type="button"
            onClick={() => handleQuickVillage('Devrai', 16.73250, 73.90920)}
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-semibold transition"
          >
            📍 Devrai
          </button>
          <button
            type="button"
            onClick={() => handleQuickVillage('Sangli', 16.85240, 74.58150)}
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-semibold transition"
          >
            📍 Sangli
          </button>
          <button
            type="button"
            onClick={() => handleQuickVillage('Kolhapur', 16.70500, 74.24330)}
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-semibold transition"
          >
            📍 Kolhapur
          </button>
          <button
            type="button"
            onClick={() => handleQuickVillage('Satara', 17.68050, 73.99300)}
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-semibold transition"
          >
            📍 Satara
          </button>
          <button
            type="button"
            onClick={() => handleQuickVillage('Pune', 18.52040, 73.85670)}
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-semibold transition"
          >
            📍 Pune
          </button>
        </div>

        {/* Live Location Readout / Hint */}
        {liveUserCoords && (
          <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-900 text-xs flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-ping"></span>
              <span className="font-bold">Maza Live Location:</span>
              <span className="font-mono font-semibold text-slate-900">
                {liveUserCoords[0].toFixed(5)}°N, {liveUserCoords[1].toFixed(5)}°E
              </span>
              <span className="text-[11px] text-sky-700 font-medium">
                ({liveAccuracy && liveAccuracy > 500 ? `Desktop IP Estimate ±${Math.round(liveAccuracy/1000)}km` : `Precision ±${liveAccuracy || 4}m`})
              </span>
              {liveSource && (
                <span className="px-2 py-0.5 rounded-md bg-white border border-sky-200 text-[10px] font-bold text-sky-800">
                  {liveSource}
                </span>
              )}
            </div>

            <div className="text-[11px] text-slate-600 italic">
              💡 Tip: Click anywhere on the map to set your exact spot
            </div>
          </div>
        )}
      </div>

      {/* Map Container */}
      <div className="h-[620px] lg:h-[720px] rounded-3xl overflow-hidden border border-slate-200/80 shadow-soft relative">
        {/* Floating Map Layer Selector (Satellite, Hybrid, Street, Terrain) */}
        <div className="absolute top-4 right-4 z-[1000]">
          <MapLayerSelector currentLayer={mapLayer} onSelectLayer={setMapLayer} />
        </div>

        {/* Floating Live Location Tracking Controls */}
        <div className="absolute top-4 left-14 z-[1000] flex items-center space-x-2 pointer-events-auto">
          <button
            type="button"
            onClick={handleToggleLiveTracking}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-lg backdrop-blur-md border transition-all cursor-pointer select-none ${
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
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-900/85 hover:bg-slate-900 text-white border border-white/20 backdrop-blur-md shadow-md cursor-pointer"
              title="Maza Live Location Center करा"
            >
              <Crosshair className="w-3 h-3 text-sky-400" />
              <span>Center Me</span>
            </button>
          )}
        </div>

        {/* Live Tracking GPS Pill Indicator */}
        {liveUserCoords && (
          <div className="absolute bottom-4 left-4 z-[1000] bg-slate-900/90 backdrop-blur-md text-white px-3.5 py-2 rounded-xl text-[11px] font-semibold shadow-lg border border-white/20 flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-ping"></span>
            <span className="text-sky-400 font-bold">Maza Live Location:</span>
            <span className="font-mono text-slate-100">
              {liveUserCoords[0].toFixed(5)}°N, {liveUserCoords[1].toFixed(5)}°E
            </span>
            <span className="text-slate-400 text-[10px]">(±{liveAccuracy || 4}m)</span>
          </div>
        )}

        <MapContainer center={defaultCenter} zoom={15} scrollWheelZoom={true} className="h-full w-full">
          <MapPanController center={mapCenter} />
          <MapClickHandler onMapClick={handleMapClick} />
          <TileLayer
            key={mapLayer}
            attribution={MAP_LAYERS[mapLayer]?.attribution}
            url={MAP_LAYERS[mapLayer]?.url}
            maxZoom={MAP_LAYERS[mapLayer]?.maxZoom || 19}
            subdomains={MAP_LAYERS[mapLayer]?.subdomains || ['a', 'b', 'c']}
          />

          {/* Render Live User Location Marker (Draggable) */}
          {liveUserCoords && (
            <>
              <Marker
                position={liveUserCoords}
                icon={liveUserPinIcon}
                draggable={true}
                eventHandlers={{
                  dragend: (e) => {
                    const pos = e.target.getLatLng();
                    handleMapClick(pos.lat, pos.lng);
                  },
                }}
              >
                <Popup>
                  <div className="p-1.5 text-xs space-y-1">
                    <div className="font-bold text-sky-900 flex items-center space-x-1">
                      <span className="w-2 h-2 rounded-full bg-sky-500 animate-ping"></span>
                      <span>🔵 Maza Live Location (You are here)</span>
                    </div>
                    <div className="text-slate-600 text-[11px]">
                      Accuracy: ±{liveAccuracy || 4}m • {liveSource}
                    </div>
                    <div className="text-sky-700 font-mono text-[10px] font-bold">
                      📍 {liveUserCoords[0].toFixed(5)}°N, {liveUserCoords[1].toFixed(5)}°E
                    </div>
                    {liveAddress && (
                      <div className="text-slate-500 text-[10px] leading-tight pt-0.5">
                        {liveAddress}
                      </div>
                    )}
                    <div className="text-[10px] text-emerald-600 font-bold pt-1">
                      🕒 Time: {liveClock} (IST)
                    </div>
                    <div className="text-[10px] text-amber-600 italic">
                      🎯 Draggable pin: Drag to adjust exact position
                    </div>
                  </div>
                </Popup>
              </Marker>
              {liveAccuracy && (
                <Circle
                  center={liveUserCoords}
                  radius={Math.min(liveAccuracy, 500)}
                  pathOptions={{ color: '#0284c7', fillColor: '#38bdf8', fillOpacity: 0.2, weight: 2 }}
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
                    <div className="text-[10px] text-slate-400 font-mono">
                      🕒 {formatShortTime(issue.createdAt || issue.location?.detectedAt)}
                    </div>
                    <div className="pt-1">
                      <button
                        onClick={() => navigate(`/issues/${issue._id}`)}
                        className="w-full py-1.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] text-center cursor-pointer shadow-xs"
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
