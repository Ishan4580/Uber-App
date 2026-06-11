package com.rideShare.payment_service.Repository;

import com.rideShare.payment_service.Model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository  extends JpaRepository<Payment, String> {

    Optional<Payment> findByRideId(String rideId);
    List<Payment> findByRiderIdOrderByCreatedAtDesc(String riderId);
}
