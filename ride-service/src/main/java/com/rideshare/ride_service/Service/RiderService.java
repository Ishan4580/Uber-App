package com.rideshare.ride_service.Service;

import com.rideshare.ride_service.Event.UserRegisteredEvent;
import com.rideshare.ride_service.Model.Rider;
import com.rideshare.ride_service.Repository.RideRepository;
import com.rideshare.ride_service.Repository.RiderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class RiderService {

    private final RiderRepository riderRepository;

    //Called by UserRegisteredConsumer when a RIDER registers in auth-service.
    //Creates the rider profile in ride-service's own DB.
    public void creatRiderProfile(UserRegisteredEvent event){
        log.info("Creating rider profile. riderId: {}", event.getUserId());

        if(riderRepository.existsById(event.getUserId())){
            log.info("Rider already exists for userId: {}. skipping.", event.getUserId());
            return;
        }

        Rider rider = Rider.builder()
                .riderId(event.getUserId())
                .name(event.getName())
                .phone(event.getPhone())
                .totalRides(0)
                .averageRating(0.0)
                .preferredPaymentMethod("CASH")
                .active(true)
                .build();

        riderRepository.save(rider);
        log.info("Rider profile created successfully for riderId: {}", event.getUserId());
    }

    /**
     * Called by RideService.requestRide() to validate rider before creating a ride.
     * Throws RuntimeException if rider not found or inactive.
     */
    public Rider getRider(String riderId){
        return riderRepository.findById(riderId)
                .filter(Rider::isActive)
                .orElseThrow(() -> new RuntimeException("Rider not found or inactive. riderId: " + riderId));
    }

    //Called by RiderService.completeRide() after every completed ride.
    public void incrementRideCount(String riderId){
        riderRepository.findById(riderId).ifPresent(rider -> {
            rider.setTotalRides(rider.getTotalRides() + 1);
            riderRepository.save(rider);
            log.info("Rider {} total rides: {}", riderId, rider.getTotalRides());
        });
    }
}
