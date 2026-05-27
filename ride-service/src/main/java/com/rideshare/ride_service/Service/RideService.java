package com.rideshare.ride_service.Service;


import com.rideshare.ride_service.DTO.RideRequest;
import com.rideshare.ride_service.DTO.RideResponse;
import com.rideshare.ride_service.Event.RideRequestEvent;
import com.rideshare.ride_service.Mappers.RideMapper;
import com.rideshare.ride_service.Model.Ride;
import com.rideshare.ride_service.Model.RideStatus;
import com.rideshare.ride_service.Repository.RideRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@RequiredArgsConstructor
public class RideService {

    private final RideRepository rideRepository;
    private final KafkaTemplate<String, RideRequestEvent> kafkaTemplate;

    private static final String RIDE_REQUEST_TOPIC = "ride.requested";

    /**
     * create ride in DB with REQUESTED STATUS
     */

    public RideResponse requestRide(RideRequest rideRequest){
        log.info("Processing ride request for rider: {}", rideRequest.getRiderId());

        Ride ride = RideMapper.toEntity(rideRequest);

        Ride saveRide = rideRepository.save(ride);

        //Step 2: publish even to Kafka
        //Matching service will consume this and find nearest driver

        RideRequestEvent event = new RideRequestEvent(
                saveRide.getId(),
                saveRide.getRiderId(),
                saveRide.getPickupLatitude(),
                saveRide.getPickupLongitude(),
                saveRide.getPickupAddress(),
                saveRide.getDropLatitude(),
                saveRide.getDropLongitude(),
                saveRide.getDropAddress()
        );

        kafkaTemplate.send(RIDE_REQUEST_TOPIC,saveRide.getId(), event);
        log.info("Ride request event published to Kafka for rideId: {}", saveRide.getId());

        //update status to Matching
        saveRide.setStatus(RideStatus.MATCHING);
        rideRepository.save(saveRide);

        return  RideMapper.toResponse(saveRide);
    }























}
