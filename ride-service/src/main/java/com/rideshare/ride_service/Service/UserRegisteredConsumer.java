package com.rideshare.ride_service.Service;

import com.rideshare.ride_service.Event.UserRegisteredEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserRegisteredConsumer {

    private final RiderService riderService;

    /**
     * groupId = "rider-service-user-group"
     * Different from driver-service's "driver-service-user-group"
     * Both services get every message from user. registered topic
     */


    public void onUserRegistered(UserRegisteredEvent event){
        log.info("ride-service: user.registered received. userId: {}, role: {}", event.getUserId(), event.getRole());

        //only handle Rider registrations
        if(!"RIDER".equals(event.getRole())){
            log.info("Ignoring user registration for non-rider. userId: {}, role: {}", event.getUserId(), event.getRole());
            return;
        }

        try{
            riderService.creatRiderProfile(event);
        } catch (Exception e) {
            log.error("Error processing user registration for riderId: {}. Error: {}", event.getUserId(), e.getMessage());
        }
    }
}
