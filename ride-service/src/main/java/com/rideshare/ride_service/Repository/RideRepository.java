package com.rideshare.ride_service.Repository;

import com.rideshare.ride_service.Model.Ride;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RideRepository extends JpaRepository<Ride, Long> {
}
