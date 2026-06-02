package com.rideshare.matching_service.Service;

import com.rideshare.matching_service.Event.RideRequestedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@RequiredArgsConstructor
public class RideEventConsumer {

    private final MatchingService matchingService;

    /**
     * Listens to ride.requested kafka topic.
     * Triggered every time Ride Service published a new ride request
     *
     * FLOW:
     * Ride Service -> Kafka (ride.requested) -> This Consumer -> MatchingService
     */

    @KafkaListener(
            topics = "ride.requested",
            groupId = "matching-service-group"
    )
    public void consumeRideRequestedEvent(RideRequestedEvent event){
        try{
            if(event == null) {
                log.error("Received null ride requested event");
                return;
            }

            log.info("Processing ride requested event. RideId: {}, Rider: {}",
                    event.getRideId(), event.getRiderId());

            matchingService.matchDriverForRide(event);

            log.info("Ride matching completed for rideId: {}", event.getRideId());
        }
        catch (Exception e){
            log.error("Error processing ride request: {} - {}",
                    event != null ? event.getRideId() : "unknown",
                    e.getMessage(), e);

            // In production: send to dead letter queue for retry
        }
    }
}
