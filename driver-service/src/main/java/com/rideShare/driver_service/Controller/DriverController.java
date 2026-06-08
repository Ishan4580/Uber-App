package com.rideShare.driver_service.Controller;

import com.rideShare.driver_service.Model.Driver;
import com.rideShare.driver_service.Model.DriverStatus;
import com.rideShare.driver_service.Service.DriverService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/drivers")
@RequiredArgsConstructor
public class DriverController {

    private final DriverService driverService;


     //Called by matching-service feign client

    @GetMapping("/{driverId}/rating")
    public ResponseEntity<Map<String, Double>> getDriverRating(
            @PathVariable String driverId){
        return ResponseEntity.ok(Map.of("rating", driverService.getDriverRating(driverId)));
    }



     // Called by frontend to show driver profile

    @GetMapping("/{driverId}")
    public ResponseEntity<Driver> getDriver(@PathVariable String driverId){
        return ResponseEntity.ok(driverService.getDriver(driverId));
    }

    //Called by  driver app when going online / offline

    @PutMapping("/{driverId}/status")
    public  ResponseEntity<Driver> updateStatus(
            @PathVariable String driverId,
            @RequestBody Map<String, String> body){
        DriverStatus status = DriverStatus.valueOf(body.get("status"));
        return ResponseEntity.ok(driverService.updateStatus(driverId, status));
    }

    //Called by driver app to show earnings summary
    @GetMapping("/{driverId}/earnings")
    public ResponseEntity<Map<String, Object>> getEarnings(@PathVariable String driverId){
        Driver drivers = driverService.getDriver(driverId);
        return ResponseEntity.ok(Map.of(
                "totalEarnings", drivers.getTotalEarnings(),
                "totalRides", drivers.getTotalRides(),
                "averageRatings", drivers.getAverageRating()
        ));
    }


































}
