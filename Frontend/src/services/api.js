// API service layer for Ride Service and Location Service
// Includes a fully functional client-side Mock Mode for sandbox testing when backend services are down.

const RIDE_SERVICE_BASE = 'http://localhost:8083/api/v1/rides';
const LOCATION_SERVICE_BASE = 'http://localhost:8082/api/v1/location';

// Mock DB Initializer
const initMockDB = () => {
  if (!localStorage.getItem('uber_mock_rides')) {
    localStorage.setItem('uber_mock_rides', JSON.stringify([]));
  }
  if (!localStorage.getItem('uber_mock_drivers')) {
    const defaultDrivers = [
      { id: 'driver:1', name: 'Rahul Sharma', rating: 4.8, vehicle: 'Maruti Suzuki Dzire (White)', latitude: 18.5204, longitude: 73.8567, status: 'ONLINE', phone: '+91 98765 43210' },
      { id: 'driver:2', name: 'Amit Patel', rating: 4.7, vehicle: 'Hyundai Aura (Silver)', latitude: 18.5304, longitude: 73.8467, status: 'ONLINE', phone: '+91 98765 43211' },
      { id: 'driver:3', name: 'Priya Joshi', rating: 4.9, vehicle: 'Tata Nexon EV (Teal)', latitude: 18.5104, longitude: 73.8667, status: 'ONLINE', phone: '+91 98765 43212' },
      { id: 'driver:4', name: 'Sanjay Dutt', rating: 4.6, vehicle: 'Toyota Etios (White)', latitude: 18.5404, longitude: 73.8367, status: 'ONLINE', phone: '+91 98765 43213' }
    ];
    localStorage.setItem('uber_mock_drivers', JSON.stringify(defaultDrivers));
  }
};
initMockDB();

// Helpers for localStorage mock state
const getMockRides = () => JSON.parse(localStorage.getItem('uber_mock_rides') || '[]');
const saveMockRides = (rides) => localStorage.setItem('uber_mock_rides', JSON.stringify(rides));
const getMockDrivers = () => JSON.parse(localStorage.getItem('uber_mock_drivers') || '[]');
const saveMockDrivers = (drivers) => localStorage.setItem('uber_mock_drivers', JSON.stringify(drivers));

// Simulation Engine for Mock Mode
const simulateBackendMatching = (rideId) => {
  setTimeout(() => {
    const rides = getMockRides();
    const rideIndex = rides.findIndex(r => r.id === rideId);
    if (rideIndex !== -1 && rides[rideIndex].status === 'MATCHING') {
      const drivers = getMockDrivers().filter(d => d.status === 'ONLINE');
      if (drivers.length > 0) {
        // Match with the first available driver (closest or random)
        const selectedDriver = drivers[Math.floor(Math.random() * drivers.length)];
        
        rides[rideIndex].status = 'ACCEPTED';
        rides[rideIndex].driverId = selectedDriver.id;
        rides[rideIndex].driverName = selectedDriver.name;
        rides[rideIndex].driverRating = selectedDriver.rating;
        rides[rideIndex].driverVehicle = selectedDriver.vehicle;
        rides[rideIndex].driverPhone = selectedDriver.phone;
        rides[rideIndex].updatedAt = new Date().toISOString();
        saveMockRides(rides);

        // Notify matching event in log
        console.log(`[Mock System] Matched Driver ${selectedDriver.name} to Ride ${rideId}`);
      }
    }
  }, 3000); // 3 seconds matching delay
};

// Mode configuration
let mockMode = true; // Default to true for ease of use, can be toggled by UI
export const setMockMode = (enabled) => {
  mockMode = enabled;
  console.log(`[System] Service API Mode set to: ${enabled ? 'MOCK' : 'REAL API'}`);
};
export const getMockMode = () => mockMode;

// Helper to determine if we should fall back to mock
const handleRequest = async (url, options = {}) => {
  if (mockMode) {
    throw new Error('MOCK_MODE_ENABLED');
  }
  
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 3000); // 3s request timeout
    
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    
    clearTimeout(id);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError' || error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      console.warn(`Connection failed to ${url}. Falling back to client-side mock logic.`);
      throw new Error('FALLBACK_TO_MOCK');
    }
    throw error;
  }
};

export const api = {
  // --- RIDER SERVICES ---
  
  // 1. Request a Ride
  requestRide: async (rideData) => {
    try {
      return await handleRequest(`${RIDE_SERVICE_BASE}/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rideData),
      });
    } catch (e) {
      if (e.message === 'MOCK_MODE_ENABLED' || e.message === 'FALLBACK_TO_MOCK') {
        const id = 'mock-' + Math.random().toString(36).substr(2, 9);
        const distance = Math.sqrt(
          Math.pow(rideData.dropLatitude - rideData.pickupLatitude, 2) +
          Math.pow(rideData.dropLongitude - rideData.pickupLongitude, 2)
        ) * 111; // Approx km in degree
        
        const estimatedFare = Math.round(50 + distance * 15); // Base 50 + 15/km
        
        const newRide = {
          id,
          riderId: rideData.riderId || 'rider_123',
          driverId: null,
          status: 'MATCHING',
          estimatedFare,
          pickupLatitude: rideData.pickupLatitude,
          pickupLongitude: rideData.pickupLongitude,
          pickupAddress: rideData.pickupAddress || 'Pickup Address',
          dropLatitude: rideData.dropLatitude,
          dropLongitude: rideData.dropLongitude,
          dropAddress: rideData.dropAddress || 'Drop Address',
          actualFare: 0.0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          startedAt: null,
          completedAt: null
        };
        
        const rides = getMockRides();
        rides.unshift(newRide);
        saveMockRides(rides);
        
        // Trigger simulated driver assignment
        simulateBackendMatching(id);
        
        return newRide;
      }
      throw e;
    }
  },

  // 2. Get Ride Details
  getRideDetails: async (rideId) => {
    try {
      return await handleRequest(`${RIDE_SERVICE_BASE}/${rideId}`);
    } catch (e) {
      if (e.message === 'MOCK_MODE_ENABLED' || e.message === 'FALLBACK_TO_MOCK') {
        const rides = getMockRides();
        const ride = rides.find(r => r.id === rideId);
        if (!ride) throw new Error('Ride not found');
        return ride;
      }
      throw e;
    }
  },

  // 3. Get Rider History
  getRiderHistory: async (riderId) => {
    try {
      return await handleRequest(`${RIDE_SERVICE_BASE}/rider/${riderId}`);
    } catch (e) {
      if (e.message === 'MOCK_MODE_ENABLED' || e.message === 'FALLBACK_TO_MOCK') {
        const rides = getMockRides();
        return rides.filter(r => r.riderId === riderId);
      }
      throw e;
    }
  },

  // 4. Cancel Ride
  cancelRide: async (rideId) => {
    try {
      return await handleRequest(`${RIDE_SERVICE_BASE}/${rideId}/cancel`, {
        method: 'PUT'
      });
    } catch (e) {
      if (e.message === 'MOCK_MODE_ENABLED' || e.message === 'FALLBACK_TO_MOCK') {
        const rides = getMockRides();
        const index = rides.findIndex(r => r.id === rideId);
        if (index === -1) throw new Error('Ride not found');
        
        rides[index].status = 'CANCELLED';
        rides[index].updatedAt = new Date().toISOString();
        saveMockRides(rides);
        return rides[index];
      }
      throw e;
    }
  },

  // --- DRIVER SERVICES ---

  // 5. Start Ride
  startRide: async (rideId) => {
    try {
      return await handleRequest(`${RIDE_SERVICE_BASE}/${rideId}/start`, {
        method: 'PUT'
      });
    } catch (e) {
      if (e.message === 'MOCK_MODE_ENABLED' || e.message === 'FALLBACK_TO_MOCK') {
        const rides = getMockRides();
        const index = rides.findIndex(r => r.id === rideId);
        if (index === -1) throw new Error('Ride not found');
        
        rides[index].status = 'RIDE_STARTED';
        rides[index].startedAt = new Date().toISOString();
        rides[index].updatedAt = new Date().toISOString();
        saveMockRides(rides);
        return rides[index];
      }
      throw e;
    }
  },

  // 6. Complete Ride
  completeRide: async (rideId) => {
    try {
      return await handleRequest(`${RIDE_SERVICE_BASE}/${rideId}/complete`, {
        method: 'PUT'
      });
    } catch (e) {
      if (e.message === 'MOCK_MODE_ENABLED' || e.message === 'FALLBACK_TO_MOCK') {
        const rides = getMockRides();
        const index = rides.findIndex(r => r.id === rideId);
        if (index === -1) throw new Error('Ride not found');
        
        rides[index].status = 'COMPLETED';
        rides[index].actualFare = rides[index].estimatedFare;
        rides[index].completedAt = new Date().toISOString();
        rides[index].updatedAt = new Date().toISOString();
        saveMockRides(rides);
        return rides[index];
      }
      throw e;
    }
  },

  // --- LOCATION SERVICES ---

  // 7. Update Driver Location
  updateDriverLocation: async (driverId, latitude, longitude) => {
    const data = { driverId, latitude, longitude };
    try {
      return await handleRequest(`${LOCATION_SERVICE_BASE}/drivers/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (e) {
      if (e.message === 'MOCK_MODE_ENABLED' || e.message === 'FALLBACK_TO_MOCK') {
        // Update driver coordinates in local storage
        const drivers = getMockDrivers();
        const idx = drivers.findIndex(d => d.id === driverId);
        if (idx !== -1) {
          drivers[idx].latitude = latitude;
          drivers[idx].longitude = longitude;
          drivers[idx].status = 'ONLINE';
          drivers[idx].lastUpdated = new Date().toISOString();
          saveMockDrivers(drivers);
        } else {
          drivers.push({
            id: driverId,
            name: `Driver ${driverId.split(':')[1] || 'X'}`,
            rating: 4.8,
            vehicle: 'Maruti Suzuki Swift (Silver)',
            latitude,
            longitude,
            status: 'ONLINE',
            phone: '+91 90000 00000',
            lastUpdated: new Date().toISOString()
          });
          saveMockDrivers(drivers);
        }
        return { success: true, message: 'Mock location updated' };
      }
      throw e;
    }
  },

  // 8. Remove Driver (Offline)
  removeDriver: async (driverId) => {
    try {
      return await handleRequest(`${LOCATION_SERVICE_BASE}/drivers/${driverId}`, {
        method: 'DELETE'
      });
    } catch (e) {
      if (e.message === 'MOCK_MODE_ENABLED' || e.message === 'FALLBACK_TO_MOCK') {
        const drivers = getMockDrivers();
        const idx = drivers.findIndex(d => d.id === driverId);
        if (idx !== -1) {
          drivers[idx].status = 'OFFLINE';
          saveMockDrivers(drivers);
        }
        return { success: true, message: 'Driver set to OFFLINE' };
      }
      throw e;
    }
  },

  // 9. Get Nearby Drivers
  getNearbyDrivers: async (latitude, longitude, radius = 5.0) => {
    try {
      return await handleRequest(`${LOCATION_SERVICE_BASE}/drivers/nearby?latitude=${latitude}&longitude=${longitude}&radius=${radius}`);
    } catch (e) {
      if (e.message === 'MOCK_MODE_ENABLED' || e.message === 'FALLBACK_TO_MOCK') {
        const drivers = getMockDrivers().filter(d => d.status === 'ONLINE');
        
        // Calculate distances
        return drivers.map(d => {
          const dist = Math.sqrt(
            Math.pow(d.latitude - latitude, 2) +
            Math.pow(d.longitude - longitude, 2)
          ) * 111; // Approx km in degree
          return {
            driverId: d.id,
            name: d.name,
            vehicle: d.vehicle,
            rating: d.rating,
            phone: d.phone,
            distance: parseFloat(dist.toFixed(2)),
            latitude: d.latitude,
            longitude: d.longitude
          };
        }).filter(d => d.distance <= radius);
      }
      throw e;
    }
  },

  // 10. Get all rides (useful for driver view checking assignments)
  getAllRides: async () => {
    if (mockMode) {
      return getMockRides();
    }
    // Real API fallback (tries to load from local storage or returns empty since standard endpoint is missing)
    try {
      const res = await fetch(`${RIDE_SERVICE_BASE}`);
      return await res.json();
    } catch {
      return [];
    }
  }
};
