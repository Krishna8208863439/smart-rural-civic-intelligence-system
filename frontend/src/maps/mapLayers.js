// Map Tile Layer Definitions for Smart Rural Civic Intelligence System
// High-resolution satellite aerial imagery, hybrid labels, street vector, and topography

export const MAP_LAYERS = {
  hybrid: {
    id: 'hybrid',
    name: 'Satellite Hybrid',
    shortName: 'Hybrid',
    icon: '🌐',
    url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps Satellite & Hybrid',
    maxZoom: 20,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
  },
  satellite: {
    id: 'satellite',
    name: 'Satellite Aerial (Esri)',
    shortName: 'Satellite',
    icon: '🛰️',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and GIS User Community',
    maxZoom: 19,
  },
  streets: {
    id: 'streets',
    name: 'Street Road Map',
    shortName: 'Street',
    icon: '🗺️',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
    subdomains: ['a', 'b', 'c'],
  },
  terrain: {
    id: 'terrain',
    name: 'Topographic Relief',
    shortName: 'Terrain',
    icon: '⛰️',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
    maxZoom: 17,
    subdomains: ['a', 'b', 'c'],
  },
};

export const DEFAULT_MAP_LAYER = 'hybrid';
