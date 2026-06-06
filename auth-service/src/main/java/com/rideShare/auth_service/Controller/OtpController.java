package com.rideShare.auth_service.Controller;

import com.rideShare.auth_service.DTO.Request.OtpSendRequest;
import com.rideShare.auth_service.DTO.Request.OtpVerifyRequest;
import com.rideShare.auth_service.DTO.Response.OtpSendResponse;
import com.rideShare.auth_service.DTO.Response.OtpVerifyResponse;
import com.rideShare.auth_service.Service.OtpService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/auth/otp")
@Slf4j
public class OtpController {

    private final OtpService otpService;

    @PostMapping("/send")
    public ResponseEntity<OtpSendResponse> sendOtp(
            @Valid @RequestBody OtpSendRequest request
            ){
        log.info("OTP send request for phone: {}", request.getPhone());

        int expiresInSeconds = otpService.sendOtp(request.getPhone());

        OtpSendResponse response =  OtpSendResponse.builder()
                .message("OTP sent to" + maskPhone(request.getPhone()))
                .expiresInSeconds(expiresInSeconds)
                .resendAfterSeconds(60)
                .build();

        return ResponseEntity.ok(response);
    }

    @PostMapping("/verify")
    public ResponseEntity<OtpVerifyResponse> verifyOtp(
            @Valid @RequestBody OtpVerifyRequest request
            ){

        log.info("OTP verify for phone: {}",request.getPhone());

        String verificationToken = otpService.verifyOtp(
                request.getPhone(),
                request.getOtp()
        );

        OtpVerifyResponse response = OtpVerifyResponse.builder()
                .verified(true)
                .phoneVerificationToken(verificationToken)
                .message("Phone verified successfully. Complete your registration within 10 minnutes.")
                .build();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/status")
    public ResponseEntity<Boolean> checkVerificationStatus(
            @RequestParam String phone){
        return ResponseEntity.ok(otpService.isPhoneVerified(phone));
    }

    private String maskPhone(String phone){
        if(phone == null || phone.length() < 6) return phone;
        return "****" + phone.substring(4);
    }
}
