package com.rideShare.payment_service.Controller;

import com.rideShare.payment_service.Model.Payment;
import com.rideShare.payment_service.Service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @GetMapping("/ride/{riderId}")
    public ResponseEntity<Payment> getPaymentByRide(
            @PathVariable String rideId){
        return ResponseEntity.ok(paymentService.getPaymentByRide(rideId));
    }
}
