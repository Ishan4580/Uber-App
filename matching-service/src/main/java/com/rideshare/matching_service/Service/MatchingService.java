package com.rideshare.matching_service.Service;

import com.rideshare.matching_service.Client.LocationServiceClient;
import com.rideshare.matching_service.DTO.NearByDriverResponse;
import com.rideshare.matching_service.Event.RideMatchedEvent;
import com.rideshare.matching_service.Event.RideRequestedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
@RequiredArgsConstructor
public class MatchingService {

    private final KafkaTemplate<String, RideMatchedEvent> kafkaTemplate;
    private static final String RIDE_MATCHED_TOPIC = "ride.Matched";
    private static final double DEFAULT_SEARCH_RADIUS_KM = 5.0;
    private final LocationServiceClient locationServiceClient;

    /**
     * Main matching algorithm
     * Called when RideRequestedEvent is consumed from Kafka
     * @param event
     *
     * STEPS:
     * 1. Ask Location Service for nearby drivers
     * 2. Score each driver and pick the best one
     * 3. Publish RideMatchedEvent to Kafka
     */

    public void matchDriverForRide(RideRequestedEvent event){

        List<NearByDriverResponse> nearbyDrivers = locationServiceClient.getNearByDriver(
                event.getPickupLatitude(),
                event.getPickupLongitude(),
                DEFAULT_SEARCH_RADIUS_KM
        );

        if(nearbyDrivers.isEmpty()){
            log.warn("No nearby drivers found for ride");
            return;
        }

        //STEPS 2: Score each driver and pick the best one
        Optional<NearByDriverResponse> bestDriver = findBestDriver(nearbyDrivers);

        if(bestDriver.isEmpty()){
            log.warn("No suitable driver found for ride");
            return;
        }

        NearByDriverResponse assignedDriver = bestDriver.get();

        //STEP 3: Publish RideMatchedEvent to Kafka
        RideMatchedEvent matchedEvent = new RideMatchedEvent(
                event.getRideId(),
                event.getRiderId(),
                assignedDriver.getDriverId(),
                assignedDriver.getLatitude(),
                assignedDriver.getLongitude(),
                assignedDriver.getDistanceInKm()
        );

        kafkaTemplate.send(RIDE_MATCHED_TOPIC, event.getRideId(), matchedEvent);
        log.info("RideMatchedEvent published");
    }

    /**
     * Driver Scoring algorithm
     *
     * Distance: 70%
     *
     * Rating: 30%
     *
     * Score: (1 / (1 + distanceInKm)) * 0.7 + (rating / 5.0) * 0.3
     * @param drivers
     * @return
     */



    private Optional<NearByDriverResponse> findBestDriver(
        List<NearByDriverResponse> drivers){

        double distanceWeight = 0.7;
        double ratingWeight = 0.3;

        return drivers.stream()
                .max(Comparator.comparingDouble(driver ->{
                    //Distance score: closer = higher score
                    //Add 0.1 to avoid division by zero

                    double distanceScore = 1.0 / (driver.getDistanceInKm() + 0.1);
                }))

    }


























}
