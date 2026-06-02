import React, { useState, useEffect } from 'react';
import AppMap from './components/Map';
import RiderDashboard from './components/RiderDashboard';
import DriverDashboard from './components/DriverDashboard';
import { api, setMockMode, getMockMode } from './services/api';
import { Shield, Sparkles, Navigation, User, Car, CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('rider'); // 'rider' or 'driver'
  const [isMock, setIsMock] = useState(getMockMode());
  
  // Shared States for Map rendering
  const [pickup, setPickup] = useState(null);
  const [drop, setDrop] = useState(null);
  const [activeDriver, setActiveDriver] = useState(null);
  const [nearbyDrivers, setNearbyDrivers] = useState([]);
  
  // Shared Ride Status
  const [activeRide, setActiveRide] = useState(null);

  // Sync API mock mode configuration
  const handleMockToggle = (checked) => {
    setIsMock(checked);
    setMockMode(checked);
  };

  // Handlers for Rider Tab updates
  const handleRiderLocationSelect = (pickupLoc, dropLoc, drivers) => {
    setPickup(pickupLoc);
    setDrop(dropLoc);
    if (!activeDriver) {
      setNearbyDrivers(drivers);
    }
  };

  // Handlers for Driver Tab updates
  const handleDriverLocationUpdate = (driver) => {
    if (driver) {
      // Driver is online, show details
      // If driver is currently matched, make sure map shows them
      if (activeRide && activeRide.driverId === driver.id) {
        setActiveDriver({
          id: driver.id,
          name: driver.name,
          vehicle: driver.vehicle,
          lat: driver.lat,
          lng: driver.lng
        });
      }
    } else {
      // Driver went offline
      if (activeDriver && activeDriver.id === driver?.id) {
        setActiveDriver(null);
      }
    }
  };

  // Sync map active driver coordinates when active ride updates
  useEffect(() => {
    if (activeRide) {
      if (activeRide.driverId) {
        // If we have a driver assigned, show them on the map
        // If we are in Driver Mode and simulating coordinates, they will update via handleDriverLocationUpdate
        // Let's poll or read driver coordinates from matching list
        const fetchDriverPos = async () => {
          try {
            const drivers = await api.getNearbyDrivers(activeRide.pickupLatitude, activeRide.pickupLongitude, 50.0);
            const matched = drivers.find(d => d.driverId === activeRide.driverId);
            if (matched) {
              setActiveDriver({
                id: matched.driverId,
                name: matched.name,
                vehicle: matched.vehicle,
                lat: matched.latitude,
                lng: matched.longitude
              });
            }
          } catch (e) {
            console.error("Error updating map driver position", e);
          }
        };

        fetchDriverPos();
        const interval = setInterval(fetchDriverPos, 2000);
        return () => clearInterval(interval);
      } else {
        setActiveDriver(null);
      }
    } else {
      setActiveDriver(null);
      setPickup(null);
      setDrop(null);
    }
  }, [activeRide]);

  // Clean up states when ride completes
  useEffect(() => {
    if (activeRide?.status === 'COMPLETED' || activeRide?.status === 'CANCELLED') {
      // Keep completed/cancelled status visible, but clean up active driver markers after a few seconds
      const timer = setTimeout(() => {
        if (activeRide?.status === 'COMPLETED' || activeRide?.status === 'CANCELLED') {
          setActiveDriver(null);
        }
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [activeRide?.status]);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#030712] text-slate-100 overflow-hidden font-sans">
      
      {/* Top Header Navbar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-900 bg-slate-950/70 backdrop-blur-md shrink-0 z-50">
        
        {/* Brand Logo */}
        <div className="flex items-center space-x-2.5">
          <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center shadow-md">
            <span className="text-slate-950 font-black text-lg tracking-tighter">U</span>
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight text-white m-0 leading-none">Uber NEXT-GEN</h1>
            <p className="text-[9px] font-mono text-slate-500 mt-0.5 uppercase tracking-wider">Event-Driven Sandbox</p>
          </div>
        </div>

        {/* Mode Select Tabs */}
        <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 shrink-0">
          <button
            onClick={() => setActiveTab('rider')}
            className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg text-xs font-bold transition duration-200 ${
              activeTab === 'rider'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="h-3.5 w-3.5" />
            <span>Rider Mode</span>
          </button>
          <button
            onClick={() => setActiveTab('driver')}
            className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg text-xs font-bold transition duration-200 ${
              activeTab === 'driver'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Car className="h-3.5 w-3.5" />
            <span>Driver Mode</span>
          </button>
        </div>

        {/* API Settings / Status */}
        <div className="flex items-center space-x-3 text-xs">
          <div className="flex items-center bg-slate-900/60 border border-slate-850 rounded-xl px-3 py-1.5 space-x-2.5">
            <span className="text-slate-400 font-medium select-none">Sandbox Simulator:</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isMock}
                onChange={(e) => handleMockToggle(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500 peer-checked:after:bg-white peer-checked:after:border-emerald-600"></div>
            </label>
          </div>

          <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900/40 border border-slate-850">
            <span className={`h-2 w-2 rounded-full ${isMock ? 'bg-emerald-400 animate-pulse' : 'bg-blue-400 animate-pulse'}`}></span>
            <span className="font-mono text-[10px] text-slate-400">
              {isMock ? 'MOCK SYSTEM ACTIVE' : 'CONNECTING localhost'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Sandbox Layout */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* Left Side Controller Card */}
        <section className="w-full md:w-[380px] xl:w-[410px] bg-slate-950/40 border-r border-slate-900/70 p-5 flex flex-col justify-between shrink-0 overflow-y-auto z-40">
          <div className="flex-1 min-h-0">
            {activeTab === 'rider' ? (
              <RiderDashboard
                riderId="rider_123"
                onLocationSelect={handleRiderLocationSelect}
                activeRide={activeRide}
                setActiveRide={setActiveRide}
              />
            ) : (
              <DriverDashboard
                onDriverLocationUpdate={handleDriverLocationUpdate}
                activeRide={activeRide}
                setActiveRide={setActiveRide}
              />
            )}
          </div>

          {/* Footer credentials */}
          <div className="pt-4 mt-4 border-t border-slate-900/60 flex items-center justify-between text-[10px] text-slate-500 font-mono">
            <span className="flex items-center">
              <Shield className="h-3 w-3 mr-1 text-slate-500" /> Secure Sandbox
            </span>
            <span>v1.0.0</span>
          </div>
        </section>

        {/* Right Side Live Map Viewer */}
        <section className="flex-1 h-full bg-[#090d16] p-4 relative z-30">
          <AppMap
            pickup={pickup}
            drop={drop}
            activeDriver={activeDriver}
            nearbyDrivers={nearbyDrivers}
          />

          {/* Floated state badges */}
          <div className="absolute top-8 right-8 z-[400] flex flex-col space-y-2 pointer-events-none">
            {activeRide && (
              <div className="bg-slate-950/90 backdrop-blur-md px-4 py-2.5 rounded-xl border border-slate-800 shadow-xl flex items-center space-x-2.5 max-w-sm animate-fade-in pointer-events-auto">
                {activeRide.status === 'COMPLETED' ? (
                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400 shrink-0" />
                ) : activeRide.status === 'CANCELLED' ? (
                  <AlertCircle className="h-4.5 w-4.5 text-rose-400 shrink-0" />
                ) : (
                  <Sparkles className="h-4.5 w-4.5 text-blue-400 animate-pulse shrink-0" />
                )}
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">RIDE STATE</p>
                  <p className="text-xs font-extrabold text-slate-100 mt-1">
                    {activeRide.status === 'MATCHING' && 'Finding Driver...'}
                    {activeRide.status === 'ACCEPTED' && 'Driver En Route'}
                    {activeRide.status === 'RIDE_STARTED' && 'Passenger On Board'}
                    {activeRide.status === 'COMPLETED' && `Finished (₹${activeRide.actualFare})`}
                    {activeRide.status === 'CANCELLED' && 'Booking Cancelled'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

      </main>

    </div>
  );
}
