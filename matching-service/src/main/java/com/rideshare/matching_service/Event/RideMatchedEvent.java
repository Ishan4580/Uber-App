package com.rideshare.matching_service.Event;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Event published to Kafka topic: ride.Matched
 * Consumed by Ride Service to update ride with assigned driver
 */


@Data
@AllArgsConstructor
@NoArgsConstructor
public class RideMatchedEvent {
    private String rideId;
    private String riderId;
    private String driverId;
    private double driverLatitude;
    private double driverLongitude;
    private double distanceToPickupKm;
}
