package com.rideShare.auth_service.Service;

import com.rideShare.auth_service.Model.User;
import com.rideShare.auth_service.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService  implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String phone) throws UsernameNotFoundException {

        log.info("Loading user by phone: {}", phone);

        User user = userRepository.findByPhone(phone)
                .orElseThrow(() -> {
                    log.info("User not found with phone: {}", phone);
                    return new UsernameNotFoundException("User not found with phone: " + phone);
                });

        return org.springframework.security.core.userdetails.User
                .withUsername(user.getPhone())
                .password(user.getPassword())
                .authorities(user.getRole().name())
                .build();
    }

    public User getUserById(String userId){
        return userRepository.findById(userId)
                .orElseThrow(() -> {
                    log.info("User not found with id: {}", userId);
                    return new RuntimeException("User not found with id: " + userId);
                });
    }

    public User getUserByPhone(String phone){
        return userRepository.findByPhone(phone)
                .orElseThrow(() -> {
                    return new RuntimeException("User not found with phone: " + phone);
                });
    }
}
