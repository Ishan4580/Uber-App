package com.rideShare.driver_service.Service;

import com.rideShare.driver_service.Event.UserRegisteredEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserRegisteredConsumer {

    private final DriverService driverService;

    /**
     * Subscribes to "user.registered" topic.
     * groupId = "driver-service-user-group"
     *
     * ride-service also listens to this same topic
     * but with groupId = "ride-service-user-group"
     *
     * Different groupId = BOTH services get every message independently.
     * same groupId = only ONE of them would get each message(load balanced)
     *
     * driver-service processes role=="DRIVER", ignores role == "RIDER
     * ride-serive processes role=="RIDER", ignores role=="DRIVER"
     */

    @KafkaListener(
            topics = "user.registered",
            groupId = "driver-service-user-group"
    )
    public  void onUSerRegistered(UserRegisteredEvent event){
        log.info("driver-service: user.registered received. userId: {}, role: {}", event.getUserId(),event.getRole());

        //Only handle Driver registrations
        if(!"DRIVER".equals(event.getRole())){
            log.info("Ignoring user registration for non-driver. userId: {}, role: {}", event.getUserId(), event.getRole());
            return;
        }

        try{
            driverService.createDriverProfile(event);
        } catch (Exception e) {
            log.error("Error processing user registration for driverId: {}. Error: {}", event.getUserId(), e.getMessage());
        }
    }
}
