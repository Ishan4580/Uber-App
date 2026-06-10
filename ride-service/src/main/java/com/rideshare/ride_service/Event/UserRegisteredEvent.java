package com.rideshare.ride_service.Event;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserRegisteredEvent {
    private String userId;
    private String name;
    private String phone;
    private String email;
    private String role;
    private String vehicleNumber;
    private String vehicleType;
}
