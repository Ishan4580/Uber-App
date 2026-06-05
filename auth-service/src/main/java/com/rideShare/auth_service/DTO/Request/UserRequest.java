package com.rideShare.auth_service.DTO.Request;

import com.rideShare.auth_service.Enum.Role;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserRequest {

    private String name;
    private String email;
    private String phone;
    private String password;
    private Role role;
    private boolean active;
}
