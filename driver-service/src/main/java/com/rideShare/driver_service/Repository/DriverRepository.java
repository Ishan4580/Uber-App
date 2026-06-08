package com.rideShare.driver_service.Repository;

import com.rideShare.driver_service.Model.Driver;
import com.rideShare.driver_service.Model.DriverStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DriverRepository extends JpaRepository<Driver, String> {
    List<Driver> findByStatusOrderByAverageRatingDesc(DriverStatus status);
}
