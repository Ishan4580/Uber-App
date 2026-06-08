package com.rideShare.driver_service.Service;

import com.rideShare.driver_service.Event.RideCompletedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class RideCompletedConsumer {

    private final DriverService driverService;

    @KafkaListener(
            topics = "ride.completed",
            groupId = "driver-service-ride-group"
    )
    public void onRideCompleted(RideCompletedEvent event){
        log.info("driver-service: ride.completed. rideId: {}, driverID: {}", event.getRideId(), event.getDriverId());

        try{
            driverService.updateAfterRideCompleted(event.getDriverId(), event.getActualFare());
        }catch (Exception e){
            log.error("Error processing ride completed for driverId: {}. Error: {}", event.getDriverId(), e.getMessage());
        }

    }
}
