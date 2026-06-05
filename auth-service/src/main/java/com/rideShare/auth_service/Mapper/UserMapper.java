package com.rideShare.auth_service.Mapper;

import com.rideShare.auth_service.DTO.Request.UserRequest;
import com.rideShare.auth_service.Model.User;

public class UserMapper {

    public static User toEntity(UserRequest request){

        if(request == null) return null;

        return User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .password(request.getPassword())
                .role(request.getRole())
                .active(request.isActive())
                .build();
    }


}
