package com.rideShare.auth_service.DTO.Response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OtpVerifyResponse {

    private Boolean verified;
    private String phoneVerificationToken;
    private String message;
}
