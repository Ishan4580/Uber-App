package com.rideShare.auth_service.DTO.Request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OtpSendRequest {
    @NotBlank(message = "Phone number is required")
    private String phone;
}
