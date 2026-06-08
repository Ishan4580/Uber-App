package com.rideShare.driver_service.Service;

import com.rideShare.driver_service.Event.UserRegisteredEvent;
import com.rideShare.driver_service.Model.Driver;
import com.rideShare.driver_service.Model.DriverStatus;
import com.rideShare.driver_service.Repository.DriverRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class DriverService {

    private final DriverRepository driverRepository;

    public void createDriverProfile(UserRegisteredEvent event){
        log.info("Creating driver profile. driverId(): {}", event.getUserId());

        //Kafka may deliver same message twice
        if(driverRepository.existsById(event.getUserId())){
            log.warn("Driver profile already exists for driverId: {}", event.getUserId());
            return;
        }

        // Save driver with same UUID as auth-service kafka send
        Driver driver = Driver.builder()
                .driverId(event.getUserId())
                .name(event.getName())
                .phone(event.getPhone())
                .vehicleNumber(event.getVehicleNumber())
                .vehicleType(event.getVehicleType())
                .status(DriverStatus.OFFLINE)
                .averageRating(0.0)
                .totalRides(0)
                .totalEarnings(0.0)
                .build();

        driverRepository.save(driver);
        log.info("Driver profile created successfully for driverId: {}", event.getUserId());
    }

    /**
     * Called Matching service via feign HTTP to get real driver rating.
     */

    public double getDriverRating(String driverId){
        return driverRepository.findById(driverId)
                .map(Driver::getAverageRating)
                .orElse(4.0); //default rating if driver not found
    }

    /**
     * Driver goes ONLINE or OFFLINE.
     * ONLINE -> location starts being tracked in Redis(via location-service)
     * OFFLINE -> removed from Redis geo index
     */
    public Driver updateStatus(String driverId, DriverStatus status){
        Driver driver = driverRepository.findById(driverId)
                .orElseThrow(() -> new RuntimeException("Driver not found with id: " + driverId));

        driver.setStatus(status);
        return driverRepository.save(driver);
    }
    /**
     * Called by RideCompletedConsumer when ride .Completed kafka event arrives.
     * Updates driver's total rides, total earnings, and sets status back to ONLINE.
     */
    public void updateAfterRideCompleted(String driverId, double fare){
        driverRepository.findById(driverId).ifPresent(driver -> {
            driver.setTotalRides(driver.getTotalRides() + 1);
            driver.setTotalEarnings(driver.getTotalEarnings() + fare);
            driver.setStatus(DriverStatus.ONLINE); // Set back to ONLINE after ride completion
            driverRepository.save(driver);
        });
    }

    public Driver getDriver(String driverId){
        return driverRepository.findById(driverId)
                .orElseThrow(() -> new RuntimeException("Driver not found with id: " + driverId));
    }






























}
