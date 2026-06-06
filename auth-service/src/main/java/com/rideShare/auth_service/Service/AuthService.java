package com.rideShare.auth_service.Service;

import com.rideShare.auth_service.DTO.Request.LoginRequest;
import com.rideShare.auth_service.DTO.Request.RegisterRequest;
import com.rideShare.auth_service.DTO.Response.AuthResponse;
import com.rideShare.auth_service.Enum.Role;
import com.rideShare.auth_service.Model.User;
import com.rideShare.auth_service.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final OtpService otpService;

    public AuthResponse registerRider(RegisterRequest request){
        log.info("Registering new rider with phone: {}", request.getPhone());

        //Validate OTP token and get phone number
        String verifiedPhone = otpService.validateVerificationToken(
                request.getPhoneVerificationToken()
        );

        if(userRepository.existsByPhone(request.getPhone())){
            log.info("User already exists with phone: {}", request.getPhone());
            throw new RuntimeException("User already exists with phone: " + request.getPhone());
        }

        if(userRepository.existsByEmail(request.getEmail())){
            log.info("User already exists with email: {}", request.getEmail());
            throw new RuntimeException("User already exists with email: " + request.getEmail());
        }

        User newUser = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .phone(verifiedPhone)
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.RIDER)
                .active(true)
                .build();

        User saveUser = userRepository.save(newUser);
        log.info("Rider saved with id: {}", saveUser.getId());

        //Generate Token

        String accessToken = jwtService.generateToken(saveUser);
        String refreshToken = jwtService.generateRefreshToken(saveUser);

        saveUser.setRefreshToken(refreshToken);
        userRepository.save(saveUser);

        return AuthResponse.builder()
                .userId(saveUser.getId())
                .name(saveUser.getName())
                .role(saveUser.getRole().name())
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .build();
    }

    public AuthResponse registerDriver(RegisterRequest request){
        log.info("Registering new Driver with phone: {}", request.getPhone());

        //Validate OTP token and get phone number
        String verifiedPhone = otpService.validateVerificationToken(
                request.getPhoneVerificationToken()
        );

        if(userRepository.existsByPhone(request.getPhone())){
            throw new RuntimeException("User already exists with phone: " + request.getPhone());
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .phone(verifiedPhone)
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.DRIVER)
                .active(true)
                .build();

        User saveUser = userRepository.save(user);

        //Generate Token
        String accessToken = jwtService.generateToken(saveUser);
        String refreshToken = jwtService.generateRefreshToken(saveUser);

        saveUser.setRefreshToken(refreshToken);
        userRepository.save(saveUser);

        return AuthResponse.builder()
                .userId(saveUser.getId())
                .name(saveUser.getName())
                .role(saveUser.getRole().name())
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .build();
    }

    public AuthResponse login(LoginRequest request){
        log.info("Login attempt with phone: {}", request.getPhone());

        User user = userRepository.findByPhone(request.getPhone())
                .orElseThrow(() -> {
                    log.info("User not found with phone: {}", request.getPhone());
                    return new RuntimeException("User not found with phone: " + request.getPhone());
                });

        if(!passwordEncoder.matches(request.getPassword(), user.getPassword())){
            log.info("Invalid password for phone: {}", request.getPhone());
            throw new RuntimeException("Invalid password");
        }

        if(!user.isActive()){
            log.info("User account is inactive for phone: {}", request.getPhone());
            throw new RuntimeException("User account is inactive");
        }

        String accessToken = jwtService.generateToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        user.setRefreshToken(refreshToken);
        userRepository.save(user);

        log.info("Login successful for phone: {}", request.getPhone());

        return AuthResponse.builder()
                .userId(user.getId())
                .name(user.getName())
                .role(user.getRole().name())
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .build();
    }

    public  void logout(String userId){
        log.info("Logout attempt for userId: {}", userId);


        User user =userRepository.findById(userId)
                .orElseThrow(() -> {
                    log.info("User not found with id: {}", userId);
                    return new RuntimeException("User not found with id: " + userId);
                });
        user.setRefreshToken(null);
        userRepository.save(user);
        log.info("Logout successfull for userId: {}", userId);
    }

    public AuthResponse refreshToken(String refreshToken){
        String userId = jwtService.extractUserId(refreshToken);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> {
                    return new RuntimeException("User not found with id: " + userId);
                });

        if(!refreshToken.equals(user.getRefreshToken())){
            log.info("Invalid refresh token for userId: {}", userId);
            throw new RuntimeException("Invalid refresh token");
        }

        return AuthResponse.builder()
                .userId(user.getId())
                .name(user.getName())
                .role(user.getRole().name())
                .accessToken(jwtService.generateToken(user))
                .refreshToken(refreshToken)
                .build();
    }
}
