import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { MapPin, Navigation, Compass, Shield, User, Clock, Phone, Star, DollarSign, Calendar, RefreshCw } from 'lucide-react';

const PUNE_PRESETS = [
  { name: 'Shivajinagar', address: 'Shivajinagar, Pune, Maharashtra', lat: 18.5204, lng: 73.8567 },
  { name: 'Pimpri', address: 'Pimpri-Chinchwad, Pune, Maharashtra', lat: 18.6298, lng: 73.7997 },
  { name: 'Kothrud', address: 'Kothrud, Pune, Maharashtra', lat: 18.5074, lng: 73.8077 },
  { name: 'Viman Nagar', address: 'Viman Nagar, Pune, Maharashtra', lat: 18.5679, lng: 73.9143 },
  { name: 'Hinjawadi Phase 1', address: 'Hinjawadi Infotech Park, Pune, Maharashtra', lat: 18.5913, lng: 73.7389 },
  { name: 'Koregaon Park', address: 'Koregaon Park, Pune, Maharashtra', lat: 18.5362, lng: 73.8930 }
];

export default function RiderDashboard({ 
  riderId = 'rider_123', 
  onLocationSelect, 
  activeRide, 
  setActiveRide 
}) {
  const [pickup, setPickup] = useState(PUNE_PRESETS[0]);
  const [drop, setDrop] = useState(PUNE_PRESETS[1]);
  const [customPickupAddress, setCustomPickupAddress] = useState('');
  const [customDropAddress, setCustomDropAddress] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [nearbyDrivers, setNearbyDrivers] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Send initial locations back to App
  useEffect(() => {
    onLocationSelect(pickup, drop, nearbyDrivers);
  }, [pickup, drop, nearbyDrivers]);

  // Fetch nearby drivers when pickup location changes
  useEffect(() => {
    let interval;
    const fetchNearby = async () => {
      try {
        const drivers = await api.getNearbyDrivers(pickup.lat, pickup.lng, 5.0);
        setNearbyDrivers(drivers);
      } catch (err) {
        console.error("Error fetching nearby drivers", err);
      }
    };
    fetchNearby();
    interval = setInterval(fetchNearby, 4000);
    return () => clearInterval(interval);
  }, [pickup]);

  // Polling for active ride status if one exists
  useEffect(() => {
    if (!activeRide) return;
    
    let interval;
    const checkStatus = async () => {
      try {
        const details = await api.getRideDetails(activeRide.id);
        setActiveRide(details);
        
        // If completed or cancelled, stop polling
        if (details.status === 'COMPLETED' || details.status === 'CANCELLED') {
          fetchHistory();
        }
      } catch (e) {
        console.error("Error polling ride status", e);
      }
    };

    interval = setInterval(checkStatus, 2000); // Poll every 2 seconds
    return () => clearInterval(interval);
  }, [activeRide?.id]);

  // Load History
  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const data = await api.getRiderHistory(riderId);
      setHistory(data);
    } catch (e) {
      console.error(e);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [riderId]);

  // Request Ride
  const handleRequestRide = async () => {
    setLoading(true);
    try {
      const rideData = {
        riderId,
        pickupLatitude: pickup.lat,
        pickupLongitude: pickup.lng,
        pickupAddress: pickup.address,
        dropLatitude: drop.lat,
        dropLongitude: drop.lng,
        dropAddress: drop.address
      };
      const ride = await api.requestRide(rideData);
      setActiveRide(ride);
    } catch (e) {
      alert("Failed to request ride: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  // Cancel Ride
  const handleCancelRide = async () => {
    if (!activeRide) return;
    try {
      const updated = await api.cancelRide(activeRide.id);
      setActiveRide(null);
      fetchHistory();
      alert("Ride cancelled successfully.");
    } catch (e) {
      alert("Failed to cancel ride: " + e.message);
    }
  };

  const calculateDistance = () => {
    const dist = Math.sqrt(
      Math.pow(drop.lat - pickup.lat, 2) +
      Math.pow(drop.lng - pickup.lng, 2)
    ) * 111;
    return parseFloat(dist.toFixed(2));
  };

  const estimatedFare = Math.round(50 + calculateDistance() * 15);

  return (
    <div className="flex flex-col h-full overflow-y-auto space-y-6 pr-1">
      {/* Rider Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 leading-tight">Rider Dashboard</h2>
            <p className="text-xs text-slate-400 font-mono">ID: {riderId}</p>
          </div>
        </div>
        <button 
          onClick={() => setShowHistory(!showHistory)} 
          className="text-xs flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-700/60 hover:bg-slate-800 transition"
        >
          <Calendar className="h-3.5 w-3.5" />
          <span>{showHistory ? "Book Ride" : "Ride History"}</span>
        </button>
      </div>

      {showHistory ? (
        /* --- RIDE HISTORY PAGE --- */
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-300">Your Booking History</h3>
            <button onClick={fetchHistory} disabled={historyLoading} className="text-slate-400 hover:text-slate-200">
              <RefreshCw className={`h-4 w-4 ${historyLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {history.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-slate-800 rounded-xl">
              <Clock className="h-8 w-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No rides booked yet</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
              {history.map((ride) => (
                <div key={ride.id} className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-slate-500">ID: {ride.id.substring(0, 8)}...</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      ride.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' :
                      ride.status === 'CANCELLED' ? 'bg-rose-500/10 text-rose-400' :
                      'bg-amber-500/10 text-amber-400'
                    }`}>
                      {ride.status}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-start space-x-2 text-xs">
                      <span className="text-emerald-400 mt-0.5">●</span>
                      <p className="text-slate-300 line-clamp-1">{ride.pickupAddress}</p>
                    </div>
                    <div className="flex items-start space-x-2 text-xs">
                      <span className="text-rose-500 mt-0.5">●</span>
                      <p className="text-slate-300 line-clamp-1">{ride.dropAddress}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
                    <span className="text-slate-400">
                      {ride.createdAt ? new Date(ride.createdAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'Date unknown'}
                    </span>
                    <span className="font-bold text-slate-100 font-mono">
                      ₹{ride.actualFare > 0 ? ride.actualFare : ride.estimatedFare}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : activeRide ? (
        /* --- ACTIVE BOOKING STATUS DISPLAY --- */
        <div className="space-y-4 animate-fade-in">
          {/* Status Header Banner */}
          <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-blue-400 font-bold">Current Ride Status</p>
              <h3 className="text-base font-extrabold text-slate-100 mt-0.5">
                {activeRide.status === 'MATCHING' && "Searching for nearby drivers..."}
                {activeRide.status === 'ACCEPTED' && "Driver assigned & arriving!"}
                {activeRide.status === 'RIDE_STARTED' && "On your way to destination"}
                {activeRide.status === 'COMPLETED' && "Arrived at destination!"}
                {activeRide.status === 'CANCELLED' && "Ride Cancelled"}
              </h3>
            </div>
            {activeRide.status === 'MATCHING' && (
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
              </div>
            )}
          </div>

          {/* Booking Info Card */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="border-r border-slate-800 pr-2">
                <span className="text-slate-500 block mb-0.5">EST. FARE</span>
                <span className="font-mono text-base font-extrabold text-slate-100">₹{activeRide.estimatedFare}</span>
              </div>
              <div className="pl-2">
                <span className="text-slate-500 block mb-0.5">DISTANCE</span>
                <span className="font-mono text-base font-extrabold text-slate-100">{calculateDistance()} km</span>
              </div>
            </div>

            <div className="space-y-2.5 pt-3 border-t border-slate-800/80">
              <div className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-500 block">PICKUP</span>
                  <p className="text-xs text-slate-300 font-medium">{activeRide.pickupAddress}</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <Navigation className="h-4 w-4 text-rose-500 mt-0.5 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-500 block">DROP</span>
                  <p className="text-xs text-slate-300 font-medium">{activeRide.dropAddress}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Assigned Driver Card */}
          {activeRide.driverId && (
            <div className="p-4 rounded-xl border border-amber-500/10 bg-amber-500/[0.02] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xl">
                    🧔
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-100">{activeRide.driverName || 'Driver Assigner'}</h4>
                    <div className="flex items-center space-x-2.5 mt-0.5">
                      <span className="flex items-center text-xs text-amber-400 font-semibold">
                        <Star className="h-3 w-3 fill-current mr-0.5" />
                        {activeRide.driverRating || '4.8'}
                      </span>
                      <span className="text-slate-500 text-xs">•</span>
                      <span className="text-xs text-slate-400">{activeRide.driverVehicle || 'Toyota Innova'}</span>
                    </div>
                  </div>
                </div>
                <a 
                  href={`tel:${activeRide.driverPhone || '9876543210'}`}
                  className="h-10 w-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 hover:bg-slate-700 hover:text-white transition"
                >
                  <Phone className="h-4 w-4" />
                </a>
              </div>
            </div>
          )}

          {/* Matching Status Screen Radar Visualizer */}
          {activeRide.status === 'MATCHING' && (
            <div className="relative py-8 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-xl">
              <div className="h-20 w-20 rounded-full bg-blue-500/5 flex items-center justify-center border border-blue-500/10">
                <Compass className="h-8 w-8 text-blue-500 animate-spin" style={{ animationDuration: '4s' }} />
              </div>
              <p className="text-xs text-slate-400 mt-4 text-center">Contacting nearby drivers...<br/>Please wait up to 30 seconds</p>
            </div>
          )}

          {/* Action Buttons */}
          {activeRide.status === 'COMPLETED' ? (
            <button
              onClick={() => setActiveRide(null)}
              className="w-full bg-emerald-500 hover:bg-emerald-600 active:scale-98 text-white font-bold text-sm py-3 px-4 rounded-xl shadow-lg shadow-emerald-500/20 transition duration-150"
            >
              Book Another Ride
            </button>
          ) : (
            <div className="flex gap-3">
              {(activeRide.status === 'MATCHING' || activeRide.status === 'ACCEPTED') && (
                <button
                  onClick={handleCancelRide}
                  className="w-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-sm py-3 px-4 rounded-xl transition duration-150"
                >
                  Cancel Ride
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        /* --- BOOKING REQUEST FORM PAGE --- */
        <div className="space-y-5 animate-fade-in">
          {/* Pickup & Drop Selectors */}
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/30 space-y-4">
              {/* Toggle Custom Coordinates Mode */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <span className="text-xs text-slate-400 font-medium">Coordinate Select Mode</span>
                <button
                  onClick={() => setIsCustomMode(!isCustomMode)}
                  className="text-xs text-blue-400 hover:underline"
                >
                  {isCustomMode ? "Use Presets" : "Use Custom Coordinates"}
                </button>
              </div>

              {!isCustomMode ? (
                /* Preset Mode UI */
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] text-slate-500 block font-bold mb-1 uppercase">Pickup Area</label>
                    <select
                      value={PUNE_PRESETS.findIndex(p => p.name === pickup.name)}
                      onChange={(e) => {
                        const index = parseInt(e.target.value);
                        setPickup(PUNE_PRESETS[index]);
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-blue-500"
                    >
                      {PUNE_PRESETS.map((p, idx) => (
                        <option key={p.name} value={idx}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block font-bold mb-1 uppercase">Dropoff Area</label>
                    <select
                      value={PUNE_PRESETS.findIndex(d => d.name === drop.name)}
                      onChange={(e) => {
                        const index = parseInt(e.target.value);
                        setDrop(PUNE_PRESETS[index]);
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-blue-500"
                    >
                      {PUNE_PRESETS.map((p, idx) => (
                        <option key={p.name} value={idx}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                /* Custom Coordinates Mode UI */
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-500 block font-bold uppercase">Custom Pickup Details</label>
                    <input
                      type="text"
                      placeholder="Address Name"
                      value={customPickupAddress}
                      onChange={(e) => {
                        setCustomPickupAddress(e.target.value);
                        setPickup(prev => ({ ...prev, address: e.target.value }));
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-blue-500"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="Latitude"
                        step="0.0001"
                        value={pickup.lat}
                        onChange={(e) => setPickup(prev => ({ ...prev, lat: parseFloat(e.target.value) || 0 }))}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-blue-500"
                      />
                      <input
                        type="number"
                        placeholder="Longitude"
                        step="0.0001"
                        value={pickup.lng}
                        onChange={(e) => setPickup(prev => ({ ...prev, lng: parseFloat(e.target.value) || 0 }))}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-slate-800/50 pt-3">
                    <label className="text-[10px] text-slate-500 block font-bold uppercase">Custom Dropoff Details</label>
                    <input
                      type="text"
                      placeholder="Address Name"
                      value={customDropAddress}
                      onChange={(e) => {
                        setCustomDropAddress(e.target.value);
                        setDrop(prev => ({ ...prev, address: e.target.value }));
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-blue-500"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="Latitude"
                        step="0.0001"
                        value={drop.lat}
                        onChange={(e) => setDrop(prev => ({ ...prev, lat: parseFloat(e.target.value) || 0 }))}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-blue-500"
                      />
                      <input
                        type="number"
                        placeholder="Longitude"
                        step="0.0001"
                        value={drop.lng}
                        onChange={(e) => setDrop(prev => ({ ...prev, lng: parseFloat(e.target.value) || 0 }))}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Ride Details Summary Card */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/10 space-y-3.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Total Distance</span>
              <span className="font-bold text-slate-200">{calculateDistance()} km</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Estimated Fare</span>
              <span className="font-extrabold text-blue-400 font-mono text-base">₹{estimatedFare}</span>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center text-emerald-400 font-semibold">
                <Shield className="h-3 w-3 mr-1" /> Verified Safe Drivers
              </span>
              <span>Pune Region Fare Rates</span>
            </div>
          </div>

          {/* Request Button */}
          <button
            onClick={handleRequestRide}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 active:scale-98 disabled:opacity-50 text-white font-bold text-sm py-3.5 px-4 rounded-xl shadow-lg shadow-blue-600/20 transition duration-150"
          >
            {loading ? "Preparing Request..." : "Request Ride Now"}
          </button>

          {/* Nearby Drivers list visualization */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Nearby Drivers ({nearbyDrivers.length})</h4>
            {nearbyDrivers.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No drivers online in this area. Switch to Driver tab and go online!</p>
            ) : (
              <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                {nearbyDrivers.map(d => (
                  <div key={d.driverId} className="flex items-center justify-between p-2 rounded-lg border border-slate-800/60 bg-slate-900/20 text-xs">
                    <div>
                      <p className="font-semibold text-slate-300">{d.name}</p>
                      <p className="text-[10px] text-slate-500">{d.vehicle}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-amber-500 font-bold flex items-center justify-end">
                        <Star className="h-2.5 w-2.5 fill-current mr-0.5" /> {d.rating}
                      </p>
                      <p className="text-[10px] text-slate-400">{d.distance} km away</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
