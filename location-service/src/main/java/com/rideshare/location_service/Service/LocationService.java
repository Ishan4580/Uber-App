package com.rideshare.location_service.Service;

import com.rideshare.location_service.Dto.DriverLocationRequest;
import com.rideshare.location_service.Dto.NewByDriverResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.geo.*;
import org.springframework.data.redis.connection.RedisGeoCommands;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class LocationService {


    private final RedisTemplate<String, String> redisTemplate;

    //Redis key for all driver location
    private static final String DRIVERS_GEO_KEY = "drivers:locations";

    /**
     * Update driver location in Redis.
     * Called every 3 seconds by driver's phone
     * Maps to Redis GEOADD command
     */

    public void updateDriverLocation(DriverLocationRequest request) {
        log.info("Updateing location for driver: {}", request.getDriverId());

        //IMPORTANT: longitude FRIST, latitude SECOND GeoSpacial Standard
        Point driverPoint = new Point(request.getLongitude(), request.getLatitude());

        redisTemplate.opsForGeo().add(DRIVERS_GEO_KEY, driverPoint, request.getDriverId());

        log.info("Driver location updated in Redis for driver: {}", request.getDriverId());
    }

    /**
     * Find nearby drivers within given radius.
     * Called by Matching Service on ride request.
     * Maps to Redis GEORADIUS command
     */

    public List<NewByDriverResponse> findNearByDrivers(
            double latitude, double longitude, double radiusInKm){
        log.info("Finding drivers near lat: {} long: {} withing {}Km",
                latitude,longitude,radiusInKm);

        Circle searchArea = new Circle(
                new Point(longitude,latitude),
                new Distance(radiusInKm, Metrics.KILOMETERS));

        GeoResults<RedisGeoCommands.GeoLocation<String>> geoResults =
                redisTemplate.opsForGeo().radius(DRIVERS_GEO_KEY, searchArea,
                RedisGeoCommands.GeoRadiusCommandArgs.newGeoRadiusArgs()
                        .includeCoordinates()
                        .includeDistance()
                        .sortAscending()
                        .limit(10));


        List<NewByDriverResponse> nearbyDrivers = new ArrayList<>();

        if(geoResults != null){
            geoResults.getContent().forEach(result ->{
                RedisGeoCommands.GeoLocation<String> location = result.getContent();
                nearbyDrivers.add(new NewByDriverResponse(
                        location.getName(),
                        location.getPoint().getY(), //latitude
                        location.getPoint().getX(), //longitude
                        result.getDistance().getValue() //distance in km
                ));
            });
        }
        log.info("Found {} drivers nearby", nearbyDrivers.size());
        return  nearbyDrivers;
    }


    /**
     * Remove driver when they go offline
     * Maps to Redis ZREM command.
     */

    public void removeDriver(String driverId){
      log.info("Removing driver: {}", driverId);
      redisTemplate.opsForGeo().remove(DRIVERS_GEO_KEY, driverId);
    }
}

































