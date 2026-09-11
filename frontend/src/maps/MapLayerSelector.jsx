import React from 'react';
import { MAP_LAYERS } from './mapLayers';

export default function MapLayerSelector({ currentLayer = 'hybrid', onSelectLayer, className = '' }) {
  return (
    <div
      className={`inline-flex items-center bg-slate-900/85 hover:bg-slate-900/95 backdrop-blur-md p-1 rounded-xl shadow-lg border border-white/20 text-xs transition-all duration-200 pointer-events-auto ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      <span className="hidden sm:inline-block px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 select-none">
        Layer:
      </span>
      <div className="flex items-center space-x-1">
        {Object.values(MAP_LAYERS).map((layer) => {
          const isActive = currentLayer === layer.id;
          return (
            <button
              key={layer.id}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSelectLayer(layer.id);
              }}
              title={layer.name}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400/40'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="text-xs">{layer.icon}</span>
              <span className="text-[11px]">{layer.shortName}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
