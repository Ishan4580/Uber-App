package com.rideshare.matching_service.Client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.Map;

@FeignClient(name = "driver-service")
public interface DriverServiceClient {

    @GetMapping("/api/v1/drivers/{driverId}/rating")
    Map<String, Double> getDriverRating(@PathVariable String driverId);
}
