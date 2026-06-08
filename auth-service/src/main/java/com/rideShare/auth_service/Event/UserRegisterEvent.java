package com.rideShare.auth_service.Event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserRegisterEvent {

    private String userId;
    private String name;
    private String phone;
    private String email;
    private String role;

    private String vehicleNumber;
    private String vehicleType;
}
