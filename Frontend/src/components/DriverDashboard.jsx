import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { Play, CheckCircle, ShieldAlert, Power, MapPin, Navigation, User, Star, Award, Compass, Car } from 'lucide-react';

const DRIVERS_LIST = [
  { id: 'driver:1', name: 'Rahul Sharma', rating: 4.8, vehicle: 'Maruti Suzuki Dzire (White)', lat: 18.5204, lng: 73.8567 },
  { id: 'driver:2', name: 'Amit Patel', rating: 4.7, vehicle: 'Hyundai Aura (Silver)', lat: 18.5304, lng: 73.8467 },
  { id: 'driver:3', name: 'Priya Joshi', rating: 4.9, vehicle: 'Tata Nexon EV (Teal)', lat: 18.5104, lng: 73.8667 },
  { id: 'driver:4', name: 'Sanjay Dutt', rating: 4.6, vehicle: 'Toyota Etios (White)', lat: 18.5404, lng: 73.8367 }
];

export default function DriverDashboard({ 
  onDriverLocationUpdate, 
  activeRide, 
  setActiveRide 
}) {
  const [selectedDriver, setSelectedDriver] = useState(DRIVERS_LIST[0]);
  const [isOnline, setIsOnline] = useState(false);
  const [driverLat, setDriverLat] = useState(DRIVERS_LIST[0].lat);
  const [driverLng, setDriverLng] = useState(DRIVERS_LIST[0].lng);
  
  // Simulation State
  const [assignedRide, setAssignedRide] = useState(null);
  const [simulationProgress, setSimulationProgress] = useState(0);
  const [simulatingMovement, setSimulatingMovement] = useState(false);
  
  const locUpdateIntervalRef = useRef(null);
  const assignmentIntervalRef = useRef(null);
  const movementIntervalRef = useRef(null);

  // Update driver coordinates when selection changes and is offline
  useEffect(() => {
    if (!isOnline) {
      setDriverLat(selectedDriver.lat);
      setDriverLng(selectedDriver.lng);
    }
  }, [selectedDriver, isOnline]);

  // Report location and active state to parent App
  useEffect(() => {
    onDriverLocationUpdate(
      isOnline ? {
        id: selectedDriver.id,
        name: selectedDriver.name,
        vehicle: selectedDriver.vehicle,
        lat: driverLat,
        lng: driverLng
      } : null
    );
  }, [isOnline, selectedDriver, driverLat, driverLng]);

  // Handle Online / Offline Toggle
  const toggleOnlineStatus = async () => {
    try {
      if (isOnline) {
        // Go Offline
        await api.removeDriver(selectedDriver.id);
        setIsOnline(false);
        setAssignedRide(null);
        setSimulatingMovement(false);
        // Clear timers
        if (locUpdateIntervalRef.current) clearInterval(locUpdateIntervalRef.current);
        if (assignmentIntervalRef.current) clearInterval(assignmentIntervalRef.current);
        if (movementIntervalRef.current) clearInterval(movementIntervalRef.current);
      } else {
        // Go Online
        setIsOnline(true);
        // Update first location
        await api.updateDriverLocation(selectedDriver.id, driverLat, driverLng);
        
        // Start 3-second location report loop
        locUpdateIntervalRef.current = setInterval(async () => {
          await api.updateDriverLocation(selectedDriver.id, driverLat, driverLng);
        }, 3000);

        // Start 2-second assignment checker loop
        assignmentIntervalRef.current = setInterval(async () => {
          try {
            const rides = await api.getAllRides();
            // Find if there is an active ride assigned to this driver
            const activeMatch = rides.find(r => 
              r.driverId === selectedDriver.id && 
              (r.status === 'ACCEPTED' || r.status === 'RIDE_STARTED')
            );
            
            if (activeMatch) {
              setAssignedRide(activeMatch);
              // Synced to the main active ride state
              if (!activeRide || activeRide.id !== activeMatch.id) {
                setActiveRide(activeMatch);
              }
            } else {
              setAssignedRide(null);
            }
          } catch (err) {
            console.error("Error checking assignments", err);
          }
        }, 2000);
      }
    } catch (e) {
      alert("Failed to change status: " + e.message);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (locUpdateIntervalRef.current) clearInterval(locUpdateIntervalRef.current);
      if (assignmentIntervalRef.current) clearInterval(assignmentIntervalRef.current);
      if (movementIntervalRef.current) clearInterval(movementIntervalRef.current);
    };
  }, []);

  // Monitor external ride status changes (e.g. cancelled by rider)
  useEffect(() => {
    if (activeRide) {
      if (activeRide.driverId === selectedDriver.id) {
        setAssignedRide(activeRide);
        if (activeRide.status === 'CANCELLED' || activeRide.status === 'COMPLETED') {
          setAssignedRide(null);
          setSimulatingMovement(false);
          if (movementIntervalRef.current) clearInterval(movementIntervalRef.current);
        }
      }
    } else {
      setAssignedRide(null);
      setSimulatingMovement(false);
      if (movementIntervalRef.current) clearInterval(movementIntervalRef.current);
    }
  }, [activeRide]);

  // Start Ride action
  const handleStartRide = async () => {
    if (!assignedRide) return;
    try {
      const updated = await api.startRide(assignedRide.id);
      setAssignedRide(updated);
      setActiveRide(updated);
      startSimulationMovement(updated, 'to_dropoff');
    } catch (e) {
      alert(e.message);
    }
  };

  // Complete Ride action
  const handleCompleteRide = async () => {
    if (!assignedRide) return;
    try {
      const updated = await api.completeRide(assignedRide.id);
      setAssignedRide(null);
      setActiveRide(updated);
      setSimulatingMovement(false);
      if (movementIntervalRef.current) clearInterval(movementIntervalRef.current);
      alert("Ride completed. Fare collected: ₹" + updated.actualFare);
    } catch (e) {
      alert(e.message);
    }
  };

  // Simulate movement along coordinates
  const startSimulationMovement = (ride, phase) => {
    if (movementIntervalRef.current) clearInterval(movementIntervalRef.current);
    
    setSimulatingMovement(true);
    setSimulationProgress(0);
    
    let startLat = driverLat;
    let startLng = driverLng;
    let endLat = ride.pickupLatitude;
    let endLng = ride.pickupLongitude;

    if (phase === 'to_dropoff') {
      startLat = ride.pickupLatitude;
      startLng = ride.pickupLongitude;
      endLat = ride.dropLatitude;
      endLng = ride.dropLongitude;
    }

    const steps = 10;
    let currentStep = 0;

    movementIntervalRef.current = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      setSimulationProgress(Math.round(progress * 100));

      const nextLat = startLat + (endLat - startLat) * progress;
      const nextLng = startLng + (endLng - startLng) * progress;

      setDriverLat(nextLat);
      setDriverLng(nextLng);

      // Report updated location to Location Service
      api.updateDriverLocation(selectedDriver.id, nextLat, nextLng);

      if (currentStep >= steps) {
        clearInterval(movementIntervalRef.current);
        setSimulatingMovement(false);
        // Automatically start next step or wait
        if (phase === 'to_pickup') {
          console.log("[Simulation] Driver arrived at pickup point.");
        } else {
          console.log("[Simulation] Driver arrived at dropoff point.");
        }
      }
    }, 1500); // Step every 1.5 seconds
  };

  // Start movement to pickup automatically if ride gets ACCEPTED
  useEffect(() => {
    if (assignedRide && assignedRide.status === 'ACCEPTED' && !simulatingMovement) {
      // Driver moves from current location to pickup point
      startSimulationMovement(assignedRide, 'to_pickup');
    }
  }, [assignedRide?.status]);

  return (
    <div className="flex flex-col h-full overflow-y-auto space-y-6 pr-1">
      {/* Driver Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Car className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 leading-tight">Driver Dashboard</h2>
            <p className="text-xs text-slate-400 font-mono">ID: {selectedDriver.id}</p>
          </div>
        </div>

        {/* Online Toggle Indicator */}
        <button
          onClick={toggleOnlineStatus}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border font-bold text-xs transition duration-150 active:scale-95 ${
            isOnline 
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30' 
              : 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
          }`}
        >
          <Power className="h-3.5 w-3.5" />
          <span>{isOnline ? "Go Offline" : "Go Online"}</span>
        </button>
      </div>

      {/* Driver Identity Selector */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/30 space-y-3">
        <label className="text-[10px] text-slate-500 block font-bold uppercase">Select Driver Identity</label>
        <select
          value={DRIVERS_LIST.findIndex(d => d.id === selectedDriver.id)}
          onChange={(e) => {
            if (isOnline) {
              alert("Please go offline before switching drivers!");
              return;
            }
            const idx = parseInt(e.target.value);
            setSelectedDriver(DRIVERS_LIST[idx]);
          }}
          disabled={isOnline}
          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-500 disabled:opacity-50"
        >
          {DRIVERS_LIST.map((d, idx) => (
            <option key={d.id} value={idx}>{d.name} ({d.vehicle})</option>
          ))}
        </select>

        <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/60 text-slate-400">
          <span className="flex items-center">
            <Star className="h-3.5 w-3.5 text-amber-500 fill-current mr-1" />
            Rating: <strong className="text-slate-200 ml-1">{selectedDriver.rating}</strong>
          </span>
          <span className="flex items-center">
            <Award className="h-3.5 w-3.5 text-blue-400 mr-1" />
            Verified Fleet
          </span>
        </div>
      </div>

      {/* Status visualizer */}
      {!isOnline ? (
        <div className="py-12 border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center p-4">
          <div className="h-16 w-16 bg-slate-900 rounded-full flex items-center justify-center border border-slate-800 text-slate-500 mb-4 text-2xl">
            💤
          </div>
          <h3 className="text-sm font-bold text-slate-300">You are currently Offline</h3>
          <p className="text-xs text-slate-500 max-w-[200px] mt-1">Go online to receive and match ride requests in real-time.</p>
        </div>
      ) : assignedRide ? (
        /* --- ASSIGNED ACTIVE RIDE SCREEN --- */
        <div className="space-y-4 animate-fade-in">
          {/* Incoming Header */}
          <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
            <p className="text-[10px] uppercase tracking-wider text-amber-400 font-bold">Matched Active Assignment</p>
            <h3 className="text-base font-extrabold text-slate-100 mt-0.5">
              {assignedRide.status === 'ACCEPTED' && (simulatingMovement ? "Driving to pickup point..." : "Awaiting passenger arrival")}
              {assignedRide.status === 'RIDE_STARTED' && (simulatingMovement ? "Driving to destination..." : "Arrived at dropoff")}
            </h3>
            {simulatingMovement && (
              <div className="w-full bg-slate-950 h-1 rounded-full mt-3 overflow-hidden border border-slate-800">
                <div 
                  className="bg-amber-400 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${simulationProgress}%` }}
                ></div>
              </div>
            )}
          </div>

          {/* Ride addresses card */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 space-y-4">
            <div className="flex items-center justify-between text-xs border-b border-slate-800/80 pb-3">
              <div>
                <span className="text-slate-500 block">RIDER</span>
                <span className="font-semibold text-slate-200">{assignedRide.riderId}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block">FARE REVENUE</span>
                <span className="font-mono text-sm font-extrabold text-amber-400">₹{assignedRide.estimatedFare}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-500 block">PICKUP</span>
                  <p className="text-xs text-slate-300 font-medium">{assignedRide.pickupAddress}</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <Navigation className="h-4 w-4 text-rose-500 mt-0.5 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-500 block">DROP</span>
                  <p className="text-xs text-slate-300 font-medium">{assignedRide.dropAddress}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          {assignedRide.status === 'ACCEPTED' && (
            <button
              onClick={handleStartRide}
              disabled={simulatingMovement && simulationProgress < 100}
              className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-60 active:scale-98 text-slate-950 font-extrabold text-sm py-3.5 px-4 rounded-xl shadow-lg shadow-amber-500/20 transition duration-150 flex items-center justify-center space-x-2"
            >
              <Play className="h-4 w-4 fill-current" />
              <span>{simulatingMovement && simulationProgress < 100 ? `Driving to Pickup (${simulationProgress}%)` : "Start Ride"}</span>
            </button>
          )}

          {assignedRide.status === 'RIDE_STARTED' && (
            <button
              onClick={handleCompleteRide}
              disabled={simulatingMovement && simulationProgress < 100}
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 active:scale-98 text-white font-extrabold text-sm py-3.5 px-4 rounded-xl shadow-lg shadow-emerald-500/20 transition duration-150 flex items-center justify-center space-x-2"
            >
              <CheckCircle className="h-4 w-4" />
              <span>{simulatingMovement && simulationProgress < 100 ? `Driving to Destination (${simulationProgress}%)` : "Complete Ride"}</span>
            </button>
          )}
        </div>
      ) : (
        /* --- ONLINE WAITING SCREEN --- */
        <div className="space-y-4 animate-fade-in">
          <div className="py-12 border border-dashed border-emerald-500/20 bg-emerald-500/[0.01] rounded-2xl flex flex-col items-center justify-center text-center p-4">
            <div className="relative flex items-center justify-center mb-4">
              <span className="animate-ping absolute inline-flex h-12 w-12 rounded-full bg-emerald-500/10 opacity-75"></span>
              <div className="relative h-12 w-12 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/30 text-emerald-400">
                <Compass className="h-6 w-6 animate-spin" style={{ animationDuration: '6s' }} />
              </div>
            </div>
            <h3 className="text-sm font-bold text-slate-200">Waiting for Ride Assignment...</h3>
            <p className="text-xs text-slate-400 max-w-[220px] mt-1">Your location is updating live on the map. You will be automatically matched.</p>
          </div>

          {/* Coordinate debug metrics */}
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/20 space-y-2.5 font-mono text-[10px] text-slate-400">
            <div className="flex items-center justify-between">
              <span>LATITUDE</span>
              <span className="text-slate-200">{driverLat.toFixed(5)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>LONGITUDE</span>
              <span className="text-slate-200">{driverLng.toFixed(5)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>LAST API REPORT</span>
              <span className="text-slate-500">Every 3s</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
