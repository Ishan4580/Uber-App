package com.rideshare.ride_service.Repository;

import com.rideshare.ride_service.Model.Ride;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RideRepository extends JpaRepository<Ride, String> {

    List<Ride> findByRiderIdOrderByCreatedAtDese(String riderId);
}
