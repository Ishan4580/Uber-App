package com.rideshare.ride_service.Event;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RideStartedEvent {

    private String rideId;
    private String riderId;
    private String driverId;
    private double actualFare;
}
