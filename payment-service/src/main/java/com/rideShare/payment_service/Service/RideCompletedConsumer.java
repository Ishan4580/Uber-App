package com.rideShare.payment_service.Service;

import com.rideShare.payment_service.Event.RideCompletedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class RideCompletedConsumer {

    private final PaymentService paymentService;

    //groupId = "payment-service-group"
    //Different from driver-service-ride-group and notification-ride-completed
    //All 3 services get the same ride.completed message simultaneously
    @KafkaListener(
            topics = "ride.completed",
            groupId = "payment-service-group"
    )
    public void onRideCompleted(RideCompletedEvent event){
        log.info("payment-service: ride.completed received. rideId: {}", event.getRideId());
        try{
            paymentService.createPaymentForRide(event);
        }catch (Exception e){
            log.error("Error processing payment for rideId: {}. Error: {}", event.getRideId(), e.getMessage());
        }
    }
}
