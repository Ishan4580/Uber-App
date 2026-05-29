package com.rideshare.ride_service.Mappers;

import com.rideshare.ride_service.DTO.RideRequest;
import com.rideshare.ride_service.DTO.RideResponse;
import com.rideshare.ride_service.Model.Ride;
import com.rideshare.ride_service.Model.RideStatus;

public class RideMapper {

    public static Ride toEntity(RideRequest request){
        if(request == null) return null;

        return Ride.builder()
                .riderId(request.getRiderId())
                .pickupLongitude(request.getPickupLongitude())
                .pickupLatitude(request.getPickupLatitude())
                .pickupAddress(request.getPickupAddress())
                .dropLongitude(request.getDropLongitude())
                .dropLatitude(request.getDropLatitude())
                .dropAddress(request.getDropAddress())
                .status(RideStatus.REQUESTED)
                .estimatedFare(calculateEstimateFare(request))
                .build();
    }

    public static RideResponse toResponse(Ride ride){
        if(ride == null) return null;

        return new RideResponse(
                ride.getId(),
                ride.getRiderId(),
                ride.getDriverId(),
                ride.getPickupLatitude(),
                ride.getPickupLongitude(),
                ride.getPickupAddress(),
                ride.getDropLatitude(),
                ride.getDropLongitude(),
                ride.getDropAddress(),
                ride.getStatus(),
                ride.getEstimatedFare(),
                ride.getActualFare(),
                ride.getCreatedAt(),
                ride.getUpdatedAt(),
                ride.getStartedAt(),
                ride.getCompletedAt()
        );
    }

    private static double calculateEstimateFare(RideRequest request){

        //Simplified Haversine distance calculation
        double lat1 = Math.toRadians(request.getPickupLatitude());
        double lat2 = Math.toRadians(request.getDropLatitude());

        double lon1 = Math.toRadians(request.getPickupLongitude());
        double lon2 = Math.toRadians(request.getDropLongitude());

        double dLat = lat2 - lat1;
        double dLon = lon2 - lon1;

        double a = Math.pow(Math.sin(dLat / 2), 2)
                   + Math.cos(lat1) * Math.cos(lat2)
                   * Math.pow(Math.sin(dLon / 2), 2);

        double c = 2 * Math.asin(Math.sqrt(a));
        double distanceKm = 6371 * c;


        //Base fare: 50Rs + 12Rs. perKm
        double fare = 50 + (distanceKm * 12);

        return Math.round(fare * 100.0) / 100.0; // Round to 2 decimal places

    }
}

