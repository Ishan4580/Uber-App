import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';

// Custom Leaflet DivIcons to allow styling with Tailwind CSS
const createPickupIcon = () => L.divIcon({
  className: 'custom-pin-pickup',
  html: `<div class="relative flex items-center justify-center">
    <div class="absolute h-8 w-8 rounded-full bg-emerald-500/30 animate-ping"></div>
    <div class="relative h-6 w-6 rounded-full bg-emerald-500 border-2 border-white shadow-lg flex items-center justify-center">
      <span class="text-white text-xs font-bold font-sans">A</span>
    </div>
  </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

const createDropIcon = () => L.divIcon({
  className: 'custom-pin-drop',
  html: `<div class="relative flex items-center justify-center">
    <div class="absolute h-8 w-8 rounded-full bg-rose-500/30 animate-ping"></div>
    <div class="relative h-6 w-6 rounded-full bg-rose-600 border-2 border-white shadow-lg flex items-center justify-center">
      <span class="text-white text-xs font-bold font-sans">B</span>
    </div>
  </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

const createDriverIcon = (name) => L.divIcon({
  className: 'custom-pin-driver',
  html: `<div class="relative flex flex-col items-center">
    <div class="bg-slate-900/90 backdrop-blur-sm text-slate-200 text-[10px] px-2 py-0.5 rounded shadow border border-slate-700/50 font-bold mb-1 whitespace-nowrap">
      ${name || 'Driver'}
    </div>
    <div class="relative h-8 w-8 rounded-full bg-amber-400 border-2 border-slate-950 shadow-xl flex items-center justify-center animate-pulse">
      <span class="text-sm">🚗</span>
    </div>
    <div class="w-1.5 h-1.5 bg-slate-950 rounded-full mt-[-2px]"></div>
  </div>`,
  iconSize: [80, 52],
  iconAnchor: [40, 49]
});

const createGenericDriverIcon = (label) => L.divIcon({
  className: 'generic-driver',
  html: `<div class="relative flex items-center justify-center">
    <div class="h-6 w-6 rounded-full bg-slate-700 border border-slate-500 shadow-md flex items-center justify-center text-xs">
      🚕
    </div>
  </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

// A sub-component to update map center/bounds dynamically
function MapController({ pickup, drop, activeDriver, nearbyDrivers }) {
  const map = useMap();

  useEffect(() => {
    if (pickup && drop) {
      // Fit to pickup and drop
      const points = [
        [pickup.lat, pickup.lng],
        [drop.lat, drop.lng]
      ];
      if (activeDriver) {
        points.push([activeDriver.lat, activeDriver.lng]);
      }
      map.fitBounds(L.latLngBounds(points), {
        padding: [60, 60],
        maxZoom: 15,
        animate: true,
        duration: 1.0
      });
    } else if (pickup) {
      map.setView([pickup.lat, pickup.lng], 14, { animate: true });
    } else if (activeDriver) {
      map.setView([activeDriver.lat, activeDriver.lng], 14, { animate: true });
    } else if (nearbyDrivers && nearbyDrivers.length > 0) {
      // Fit bounds to show all nearby drivers
      const points = nearbyDrivers.map(d => [d.latitude, d.longitude]);
      if (pickup) points.push([pickup.lat, pickup.lng]);
      map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 14 });
    }
  }, [pickup, drop, activeDriver, nearbyDrivers, map]);

  return null;
}

export default function AppMap({ pickup, drop, activeDriver, nearbyDrivers }) {
  // Pune Central center coordinate
  const defaultCenter = [18.5204, 73.8567];
  const defaultZoom = 12;

  // Generate intermediate points for polyline to simulate a path (straight line or slight arc)
  const getRoutePoints = () => {
    if (!pickup || !drop) return [];
    
    // We can draw a simple curved path or straight path. Let's make a straight line.
    return [
      [pickup.lat, pickup.lng],
      [drop.lat, drop.lng]
    ];
  };

  const routePoints = getRoutePoints();

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-slate-800 shadow-inner">
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        {/* CartoDB Dark Matter Tile Layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* Map boundaries and centering controller */}
        <MapController
          pickup={pickup}
          drop={drop}
          activeDriver={activeDriver}
          nearbyDrivers={nearbyDrivers}
        />

        {/* Pickup Marker */}
        {pickup && (
          <Marker position={[pickup.lat, pickup.lng]} icon={createPickupIcon()}>
            <Popup className="custom-popup">
              <div className="text-slate-900 p-1">
                <p className="font-bold text-xs">Pickup Location</p>
                <p className="text-[10px]">{pickup.address}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Drop Marker */}
        {drop && (
          <Marker position={[drop.lat, drop.lng]} icon={createDropIcon()}>
            <Popup className="custom-popup">
              <div className="text-slate-900 p-1">
                <p className="font-bold text-xs">Dropoff Location</p>
                <p className="text-[10px]">{drop.address}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Ride Route Polyline */}
        {routePoints.length > 0 && (
          <Polyline
            positions={routePoints}
            pathOptions={{
              color: '#3b82f6', // Tailwind blue-500
              weight: 4,
              opacity: 0.8,
              dashArray: '8, 8',
              lineJoin: 'round'
            }}
          />
        )}

        {/* Active Driver Marker (if assigned) */}
        {activeDriver && (
          <Marker position={[activeDriver.lat, activeDriver.lng]} icon={createDriverIcon(activeDriver.name)}>
            <Popup>
              <div className="text-slate-900 p-1">
                <p className="font-bold text-xs">{activeDriver.name}</p>
                <p className="text-[10px]">{activeDriver.vehicle}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Nearby Drivers Markers (when not matched yet) */}
        {!activeDriver && nearbyDrivers && nearbyDrivers.map((driver) => (
          <Marker
            key={driver.driverId}
            position={[driver.latitude, driver.longitude]}
            icon={createGenericDriverIcon()}
          >
            <Popup>
              <div className="text-slate-900 p-1">
                <p className="font-bold text-xs">{driver.name || 'Available Driver'}</p>
                <p className="text-[10px]">{driver.vehicle}</p>
                <p className="text-[9px] text-amber-600 font-semibold">★ {driver.rating} • {driver.distance} km away</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Map watermark overlay for design details */}
      <div className="absolute bottom-2 left-2 z-[400] bg-slate-950/80 backdrop-blur-md px-2 py-1 rounded text-[10px] border border-slate-800 text-slate-400 font-mono shadow-md pointer-events-none">
        Pune Region Map
      </div>
    </div>
  );
}
