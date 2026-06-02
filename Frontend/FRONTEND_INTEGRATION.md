# Uber App - Frontend Integration Guide

## 🏗️ Project Overview

This is a microservices-based ride-sharing application built with Spring Boot and Kafka for event-driven architecture.

### Services:
- **Ride Service** (Port 8083) - Manages ride creation and status transitions
- **Matching Service** (Port 8084) - Matches drivers with ride requests using location data
- **Location Service** (Port 8082) - Tracks driver locations using Redis geospatial queries

---

## 🔄 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend App                          │
│                   (Rider / Driver)                           │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┴─────────────┐
        │                          │
        ▼                          ▼
┌──────────────────┐      ┌──────────────────┐
│   Ride Service   │      │ Location Service │
│   (8083)         │      │   (8082)         │
└────────┬─────────┘      └──────────────────┘
         │
    ┌────▼────────────┐
    │  Kafka Topics   │
    ├─────────────────┤
    │ ride.requested  │
    │ ride.matched    │
    └────┬────────────┘
         │
         ▼
┌──────────────────┐
│ Matching Service │
│   (8084)         │
└──────────────────┘
```

---

## 🚀 Ride Request Flow

```
1. Rider requests ride
   ↓ POST /api/v1/rides/request
   ↓
2. Ride created with status: MATCHING
   ↓ Kafka Event: ride.requested
   ↓
3. Matching Service receives event
   ↓ Queries Location Service for nearby drivers
   ↓
4. Best driver selected based on distance + rating
   ↓ Kafka Event: ride.matched
   ↓
5. Ride Service updates ride with driver info
   ↓ Status changes to: ACCEPTED
   ↓
6. Frontend polls for driver assignment
   ↓ GET /api/v1/rides/{rideId}
   ↓
7. Shows driver info to rider
```

---

## 📡 API Reference

### Base URLs
- Ride Service: `http://localhost:8083/api/v1/rides`
- Location Service: `http://localhost:8082/api/v1/location`

---

## 🚗 RIDE SERVICE (Port 8083)

### 1️⃣ Request a New Ride

```http
POST /api/v1/rides/request
Content-Type: application/json

{
  "riderId": "rider_123",
  "pickupLatitude": 18.5204,
  "pickupLongitude": 73.8567,
  "pickupAddress": "Shivajinagar, Pune, Maharashtra",
  "dropLatitude": 18.6298,
  "dropLongitude": 73.7997,
  "dropAddress": "Pimpri, Pune, Maharashtra"
}
```

**Response (201 Created):**
```json
{
  "id": "897c9e60-1daa-4628-a37f-73b1c3ffb323",
  "riderId": "rider_123",
  "driverId": null,
  "status": "MATCHING",
  "estimatedFare": 212.81,
  "pickupLatitude": 18.5204,
  "pickupLongitude": 73.8567,
  "pickupAddress": "Shivajinagar, Pune, Maharashtra",
  "dropLatitude": 18.6298,
  "dropLongitude": 73.7997,
  "dropAddress": "Pimpri, Pune, Maharashtra",
  "actualFare": 0.0,
  "cratedAt": "2026-06-02T13:51:00.000000",
  "updatedAt": "2026-06-02T13:51:00.000000",
  "startedAt": null,
  "completedAt": null
}
```

⚠️ **Important:** Wait 1-2 seconds for Kafka processing before checking driverId!

---

### 2️⃣ Get Ride Details

```http
GET /api/v1/rides/{rideId}
```

**Response (200 OK):** Returns updated ride with driver info

---

### 3️⃣ Get Rider's Rides

```http
GET /api/v1/rides/rider/{riderId}
```

**Response:** Array of all rides for the rider

---

### 4️⃣ Start Ride (Driver)

```http
PUT /api/v1/rides/{rideId}/start
```

⚠️ **Precondition:** Status must be "ACCEPTED"

---

### 5️⃣ Complete Ride (Driver)

```http
PUT /api/v1/rides/{rideId}/complete
```

⚠️ **Precondition:** Status must be "RIDE_STARTED"

---

### 6️⃣ Cancel Ride

```http
PUT /api/v1/rides/{rideId}/cancel
```

---

## 📍 LOCATION SERVICE (Port 8082)

### 1️⃣ Update Driver Location

```http
POST /api/v1/location/drivers/update
Content-Type: application/json

{
  "driverId": "driver:6",
  "latitude": 18.5204,
  "longitude": 73.8567
}
```

⚠️ **Call every 3 seconds** from driver app

---

### 2️⃣ Get Nearby Drivers

```http
GET /api/v1/location/drivers/nearby?latitude=18.5204&longitude=73.8567&radius=5.0
```

**Response:** List of nearby drivers with distance

---

### 3️⃣ Remove Driver (Offline)

```http
DELETE /api/v1/location/drivers/{driverId}
```

---

## Ride Status Flow

```
MATCHING → ACCEPTED → RIDE_STARTED → COMPLETED
```

| Status | Meaning |
|--------|---------|
| MATCHING | Waiting for driver assignment |
| ACCEPTED | Driver assigned |
| RIDE_STARTED | Ride in progress |
| COMPLETED | Ride finished |
| CANCELLED | Cancelled |

---

## React Implementation Example

### Request Ride Hook
```typescript
const requestRide = async (rideData) => {
  const response = await fetch('http://localhost:8083/api/v1/rides/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rideData),
  });
  return response.json();
};

// Wait for driver assignment
const waitForDriver = async (rideId) => {
  for (let i = 0; i < 30; i++) {
    const ride = await fetch(`http://localhost:8083/api/v1/rides/${rideId}`).then(r => r.json());
    if (ride.driverId) return ride;
    await new Promise(r => setTimeout(r, 2000)); // Poll every 2s
  }
  return null;
};
```

### Driver Location Tracking
```typescript
const startTracking = (driverId) => {
  setInterval(async () => {
    const pos = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject);
    });
    
    await fetch('http://localhost:8082/api/v1/location/drivers/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        driverId,
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      }),
    });
  }, 3000);
};
```

---

## cURL Examples

**Request Ride:**
```bash
curl -X POST http://localhost:8083/api/v1/rides/request \
  -H "Content-Type: application/json" \
  -d '{
    "riderId": "rider_123",
    "pickupLatitude": 18.5204,
    "pickupLongitude": 73.8567,
    "pickupAddress": "Shivajinagar",
    "dropLatitude": 18.6298,
    "dropLongitude": 73.7997,
    "dropAddress": "Pimpri"
  }'
```

**Check Ride Status:**
```bash
curl http://localhost:8083/api/v1/rides/{rideId}
```

**Update Driver Location:**
```bash
curl -X POST http://localhost:8082/api/v1/location/drivers/update \
  -H "Content-Type: application/json" \
  -d '{
    "driverId": "driver:6",
    "latitude": 18.5204,
    "longitude": 73.8567
  }'
```

---

## Key Points

- **Polling:** Check for driver every 2 seconds
- **Location:** Update driver location every 3 seconds
- **Timeout:** Max 30 seconds to find driver
- **Status Changes:** MATCHING → ACCEPTED → RIDE_STARTED → COMPLETED

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| driverId is null after 30s | Ensure drivers are online (location updated) |
| Location update fails | Verify location-service is running on 8082 |
| Ride creation fails | Validate latitude/longitude range |

---

**Frontend Guide Complete!** 🚀

