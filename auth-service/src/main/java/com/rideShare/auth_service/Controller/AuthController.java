package com.rideShare.auth_service.Controller;

import com.rideShare.auth_service.DTO.Request.LoginRequest;
import com.rideShare.auth_service.DTO.Request.RegisterRequest;
import com.rideShare.auth_service.DTO.Response.AuthResponse;
import com.rideShare.auth_service.Service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register/rider")
    public ResponseEntity<AuthResponse> registerRider(
            @Valid @RequestBody RegisterRequest request
    ){
        log.info("Received registration request for rider with phone: {}", request.getPhone());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(authService.registerRider(request));
    }

    @PostMapping("/register/driver")
    public ResponseEntity<AuthResponse> registerDriver(
            @Valid @RequestBody RegisterRequest request
    ) {
        log.info("Received registration request for driver with phone: {}", request.getPhone());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(authService.registerDriver(request));
    }


    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request
    ) {
        log.info("Received login request for phone: {}", request.getPhone());

        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/logout")
    public ResponseEntity<String> logout(
            @RequestParam String userId
    ) {
        log.info("Received logout request for userId: {}", userId);

        authService.logout(userId);
        return ResponseEntity.ok("Logged out successfully");
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refreshToken(
            @RequestParam String refreshToken
    ) {
        log.info("Received token refresh request");

        return ResponseEntity.ok(authService.refreshToken(refreshToken));
    }
}
