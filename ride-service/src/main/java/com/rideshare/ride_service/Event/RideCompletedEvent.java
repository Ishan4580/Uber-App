package com.rideshare.ride_service.Event;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RideCompletedEvent {

    private String rideId;
    private String riderId;
    private String driverId;
    private  double actualFare;
}
