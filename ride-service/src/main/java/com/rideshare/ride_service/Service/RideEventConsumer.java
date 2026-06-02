package com.rideshare.ride_service.Service;

import com.rideshare.ride_service.Event.RideMatchedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@RequiredArgsConstructor
public class RideEventConsumer {

    private final RideService rideService;

    @KafkaListener(
            topics = "ride.matched",
            groupId = "ride-service-group"
    )
    public void consumeRideMatchedEvent(RideMatchedEvent event){

        log.info("Received ride matched event: {}", event);

        try {
            if(event == null) {
                log.error("Received null event");
                return;
            }

            log.info("Processing ride matched event for rideId: {}, driverId: {}", 
                    event.getRideId(), event.getDriverId());

            rideService.updateRideWithDriver(
                    event.getRideId(),
                    event.getDriverId()
            );

            log.info("Successfully updated ride with driver");
        } catch (Exception e) {
            log.error("Error processing ride matched event. RideId: {}, Error: {}", 
                    event != null ? event.getRideId() : "unknown", 
                    e.getMessage(), e);
        }
    }
}

