package com.rideshare.ride_service.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaConfig {

    //Topic where Ride Service published ride request
    //Matching Service subscribers to this topic

    @Bean
    public NewTopic rideRequestTopic(){
        return TopicBuilder.name("ride.requested")
                .partitions(3)
                .replicas(1)
                .build();
    }

    //Topic where Matching Service publisher match results
    //Ride Service subscribers to this topic

    @Bean
    public NewTopic rideMatchedTopic(){
        return TopicBuilder.name("ride.matched")
                .partitions(3)
                .replicas(1)
                .build();
    }

    //auth-service produces, ride-service + driver-service consume
    @Bean
    public NewTopic userRegisteredTopic(){
        return TopicBuilder.name("user.registered")
                .partitions(3)
                .replicas(1)
                .build();
    }

    //ride-service produces, notification-service consumes
    @Bean
    public NewTopic rideStartedTopic(){
        return TopicBuilder.name("ride.started")
                .partitions(3)
                .replicas(1)
                .build();
    }


    //ride-service produces, payment + driver + notification-service consume
    @Bean
    public NewTopic rideCompletedTopic(){
        return TopicBuilder.name("ride.completed")
                .partitions(3)
                .replicas(1)
                .build();
    }

    //ride-service produce, notification-service consume
    @Bean
    public NewTopic rideCancelledTopic(){
        return TopicBuilder.name("ride.cancelled")
                .partitions(3)
                .replicas(1)
                .build();
    }
}
