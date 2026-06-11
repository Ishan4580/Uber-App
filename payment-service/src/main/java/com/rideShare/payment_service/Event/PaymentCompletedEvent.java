package com.rideShare.payment_service.Event;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentCompletedEvent {
    private String paymentId;
    private String rideId;
    private String riderId;
    private double amount;
}
