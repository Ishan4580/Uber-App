package com.rideshare.location_service.Controller;

import com.rideshare.location_service.Dto.DriverLocationRequest;
import com.rideshare.location_service.Dto.NewByDriverResponse;
import com.rideshare.location_service.Service.LocationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/location")
@Slf4j
@RequiredArgsConstructor
public class LocationController {

    private final LocationService locationService;

    //driver phone calls this every 3 second
    @PostMapping("/drivers/update")
    public ResponseEntity<String> updateDriverLocation(
            @RequestBody DriverLocationRequest request){
        locationService.updateDriverLocation(request);
        return ResponseEntity.ok("Driver location updated successfully");
    }

    //Matching service calls this when ride is requested
    @GetMapping("/drivers/nearby")
    public ResponseEntity<List<NewByDriverResponse>> getNewByDriver(
            @RequestParam double latitude,
            @RequestParam double longitude,
            @RequestParam (defaultValue = "5.0") double radius){

        return ResponseEntity.ok(locationService.findNearByDrivers(latitude,longitude,radius));
    }

    //Called when driver goes offline
    @DeleteMapping("/drivers/{driverID}")
    public ResponseEntity<String> removeDriver(@PathVariable String driverID){
        locationService.removeDriver(driverID);
        return ResponseEntity.ok("Driver removed successfully");
    }

}
