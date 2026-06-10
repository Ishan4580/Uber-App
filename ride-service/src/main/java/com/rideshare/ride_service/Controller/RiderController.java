package com.rideshare.ride_service.Controller;

import com.rideshare.ride_service.Model.Rider;
import com.rideshare.ride_service.Service.RiderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/riders")
@RequiredArgsConstructor
public class RiderController {

    private final RiderService riderService;

    @GetMapping("/{riderId}")
    public ResponseEntity<Rider> getRider(@PathVariable String riderId){
        return ResponseEntity.ok(riderService.getRider(riderId));
    }
}
