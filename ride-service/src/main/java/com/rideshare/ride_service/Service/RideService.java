package com.rideshare.ride_service.Service;


import com.rideshare.ride_service.DTO.RideRequest;
import com.rideshare.ride_service.DTO.RideResponse;
import com.rideshare.ride_service.Event.RideCancelledEvent;
import com.rideshare.ride_service.Event.RideCompletedEvent;
import com.rideshare.ride_service.Event.RideRequestEvent;
import com.rideshare.ride_service.Event.RideStartedEvent;
import com.rideshare.ride_service.Mappers.RideMapper;
import com.rideshare.ride_service.Model.Ride;
import com.rideshare.ride_service.Model.RideStatus;
import com.rideshare.ride_service.Repository.RideRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class RideService {

    private final RideRepository rideRepository;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    private static final String RIDE_REQUEST_TOPIC = "ride.requested";
    private static final String RIDE_STARTED_TOPIC = "ride.started";
    private static final String RIDE_COMPLETED_TOPIC = "ride.completed";
    private static final String RIDE_CANCELLED_TOPIC = "ride.cancelled";

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


    @Transactional
    public void updateRideWithDriver(String rideId, String driverId){
        log.info("Attempting to update ride with driverId. RideId: {}, DriverId: {}", rideId, driverId);

        Ride ride = rideRepository.findById(rideId)
                .orElseThrow(() -> new RuntimeException("Ride not found with id: " + rideId));

        log.info("Found ride. Current status: {}, Current driverId: {}", ride.getStatus(), ride.getDriverId());

        ride.setDriverId(driverId);
        ride.setStatus(RideStatus.ACCEPTED);

        Ride updatedRide = rideRepository.save(ride);

        log.info("Ride updated successfully. New status: {}, New driverId: {}",
                updatedRide.getStatus(), updatedRide.getDriverId());
    }


    public  RideResponse startRide(String rideId){
        Ride ride = rideRepository.findById(rideId)
                .orElseThrow(() -> new RuntimeException("Ride not found with id: "));

        if(ride.getStatus() != RideStatus.ACCEPTED){
            throw new RuntimeException("Ride cannot be started. Current status: " + ride.getStatus());
        }

        ride.setStatus(RideStatus.RIDE_STARTED);
        ride.setStartedAt(LocalDateTime.now());

        rideRepository.save(ride);

        RideStartedEvent event = new RideStartedEvent(
                ride.getId(),
                ride.getRiderId(),
                ride.getDriverId()
        );
        kafkaTemplate.send(RIDE_STARTED_TOPIC, ride.getId(), event);
        log.info("Ride started event published to Kafka for rideId: {}", ride.getId());

        return RideMapper.toResponse(ride);
    }

    public RideResponse completeRide(String rideId){
        Ride ride = rideRepository.findById(rideId)
                .orElseThrow(() -> new RuntimeException("Ride not found with id: "));

        if(ride.getStatus() != RideStatus.RIDE_STARTED){
            throw new RuntimeException("Ride cannot be completed. Current status: " + ride.getStatus());
        }

        ride.setStatus(RideStatus.COMPLETED);
        ride.setCompletedAt(LocalDateTime.now());
        ride.setActualFare(ride.getEstimatedFare());
        rideRepository.save(ride);

        RideCompletedEvent event = new RideCompletedEvent(
                ride.getId(),
                ride.getRiderId(),
                ride.getDriverId(),
                String.valueOf(ride.getActualFare())
        );
        kafkaTemplate.send(RIDE_COMPLETED_TOPIC, ride.getId(), event);
        log.info("Ride completed event published to Kafka for rideId: {}", ride.getId());

        return RideMapper.toResponse(ride);
    }

    public RideResponse cancelRide(String rideId){
        Ride ride = rideRepository.findById(rideId)
                .orElseThrow(() -> new RuntimeException("Ride not found with id: "));

        ride.setStatus(RideStatus.CANCELLED);
        rideRepository.save(ride);

        RideCancelledEvent event = new RideCancelledEvent(
                ride.getId(),
                ride.getRiderId(),
                ride.getDriverId()
        );
        kafkaTemplate.send(RIDE_CANCELLED_TOPIC, ride.getId(), event);
        log.info("Ride cancelled event published to Kafka for rideId: {}", ride.getId());

        return RideMapper.toResponse(ride);
    }

    public RideResponse getRideById(String rideId){
        Ride ride = rideRepository.findById(rideId)
                .orElseThrow(() -> new RuntimeException("Ride not found with id: "));

        return RideMapper.toResponse(ride);
    }

    public List<RideResponse> getRidesByRider(String riderId){
        
        return rideRepository.findByRiderIdOrderByCreatedAtDesc(riderId)
                .stream()
                .map(RideMapper::toResponse)
                .toList();
    }




















}
