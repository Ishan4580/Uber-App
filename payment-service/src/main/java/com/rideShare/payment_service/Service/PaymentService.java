package com.rideShare.payment_service.Service;

import com.rideShare.payment_service.Event.PaymentCompletedEvent;
import com.rideShare.payment_service.Event.RideCompletedEvent;
import com.rideShare.payment_service.Model.Payment;
import com.rideShare.payment_service.Model.PaymentStatus;
import com.rideShare.payment_service.Repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final KafkaTemplate<String, PaymentCompletedEvent> kafkaTemplate;
    private static final String PAYMENT_COMPLETED_TOPIC = "payment.completed";

    public void createPaymentForRide(RideCompletedEvent event){
        log.info("Create Payment for rideId: {}", event.getRideId());

        if(paymentRepository.findByRideId(event.getRideId()).isPresent()){
            log.warn("Payment already exists for rideId: {}", event.getRideId());
            return;
        }

        Payment payment = Payment.builder()
                .rideId(event.getRideId())
                .riderId(event.getRiderId())
                .driverId(event.getDriverId())
                .amount(event.getActualFare())
                .status(PaymentStatus.COMPLETED)
                .build();

        Payment saved = paymentRepository.save(payment);

        //Publish payment.completed ->notification-service sends receipt
        kafkaTemplate.send(PAYMENT_COMPLETED_TOPIC, saved.getRideId(),
                new PaymentCompletedEvent(
                        saved.getId(),
                        saved.getRideId(),
                        saved.getRiderId(),
                        saved.getAmount()
                ));
        log.info("payment.completed published for riderId: {}", event.getRideId());
    }

    public Payment getPaymentByRide(String rideId){
        return paymentRepository.findByRideId(rideId)
                .orElseThrow(()-> new RuntimeException("Payment not found for ride: "+ rideId));
    }

}
