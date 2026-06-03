package com.rideShare.auth_service.Model;

import com.rideShare.auth_service.Enum.Role;

import java.time.LocalDateTime;

public class User {

    private String id;
    private String name;
    private String email;
    private String phone;
    private String password;
    private Role role;
    private boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
