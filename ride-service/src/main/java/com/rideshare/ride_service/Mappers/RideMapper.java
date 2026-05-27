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
                ride.getCratedAt(),
                ride.getUpdatedAt(),
                ride.getStartedAt(),
                ride.getCompletedAt()
        );
    }
}

