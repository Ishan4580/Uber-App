package com.rideShare.auth_service.Service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Duration;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class OtpService {

    private final RedisTemplate<String, String> redisTemplate;
    private final TwilioSMSService twilioSMSService;

    @Value("${otp.expiry.seconds}")
    private int otpExpirySeconds;

    @Value("${otp.verified.expiry.seconds}")
    private int verifiedExpirySeconds;

    @Value("${otp.resend.cooldown.seconds}")
    private int resendCooldownSeconds;

    //Redis key patterns
    //Using "otp:" prefix groups all OTP keys together
    private static final String OTP_KEY_PREFIX = "otp:";
    private static final String VERIFIED_KEY_PREFIX = "otp:verified:";
    private static final String COOLDOWN_KEY_PREFIX = "otp:cooldown:";


    public int sendOtp(String phone){
        log.info("OTP send requested for phone: {}", phone);

        //Check cooldown - prevent user from spamming resend
        //If cooldown key exists in Redis, user must wait
        String cooldownKey = COOLDOWN_KEY_PREFIX  + phone;

        if(redisTemplate.hasKey(cooldownKey)){
            //Get remaining cooldown time
            Long remainingSeconds = redisTemplate.getExpire(cooldownKey);
            throw new RuntimeException("OTP resend is on cooldown. Please wait " + remainingSeconds + " seconds before trying again.");
        }

        //Generate 6-digit OTP
        String otp = generateOtp();

        //Store OTP in Redis with TTl
        String otpKey = OTP_KEY_PREFIX + phone;
        redisTemplate.opsForValue().set(
                otpKey,
                otp,
                Duration.ofSeconds(otpExpirySeconds) //auto-expires in 5 min
        );

        //Set cooldown
        //Prevents user from requesting new OTP for 60 seconds
        redisTemplate.opsForValue().set(
                cooldownKey,
                "1",
                Duration.ofSeconds(resendCooldownSeconds));

        // Send SMS via Twilio
        String smsMessage = String.format(
                "Your RideShare OTP is: %s. Valid for %d minutes. Do not share with anyone",
                   otp,
                otpExpirySeconds / 60
        );
        twilioSMSService.sendSms(phone, smsMessage);

        log.info("OTP sent successfully to phone: {}",phone);
        return otpExpirySeconds;
    }

    public String verifyOtp(String phone, String enterOtp){
        log.info("OTP verification attempt for phone: {}", phone);

        String otpKey = OTP_KEY_PREFIX + phone;

        //Get stored otp from Redis
        String storedOtp = redisTemplate.opsForValue().get(otpKey);

        //Key not found = OTP expired or never sent
        if(storedOtp == null){
            log.warn("OTP not found or expired for phone: {}", phone);
            throw new RuntimeException("OTP expired or not found. Please request a new OTP");
        }

        //Compare OTPs
        if(!storedOtp.equals(enterOtp.trim())){
            log.warn("Invalid OTP entered for phone: {}", phone);
            throw new RuntimeException("Invalid OTP. Please try again");
        }

        // OTP correct - clean up and mark phone as verified
        //Delete OTP immediately - one-time use only
        redisTemplate.delete(otpKey);
        redisTemplate.delete(COOLDOWN_KEY_PREFIX + phone); //Clear cooldown on successful verification


        //Set "phone verified" marker in Redis
        String verifiedKey = VERIFIED_KEY_PREFIX + phone;
        redisTemplate.opsForValue().set(
                verifiedKey,
                "true",
                Duration.ofSeconds(verifiedExpirySeconds)
        );

        //Generate a phone verification token - a simple UUID
        //AuthService checks Redis for this before allowing registration
        String verificationToken = UUID.randomUUID().toString();

        //Store token - phone mapping so AutherSerive can look up the phone
        //Key: "Otp:verified:TOKEN_VALUE" -> phone number
        redisTemplate.opsForValue().set(
                VERIFIED_KEY_PREFIX + verificationToken,
                phone,
                Duration.ofSeconds(verifiedExpirySeconds)
        );

        log.info("Phone verified successfully: {}", phone);
        return verificationToken;
    }

    /**
     * Called by AuthService during registration to confirm phone was verified
     * Checks if the phoneVerificationToken is still valid in Redis.
     * If valid, returns the phone number associated with the token.
     * Deletes the token after retrieval (one-time use)
     */

    public String validateVerificationToken(String token){
        String key = VERIFIED_KEY_PREFIX + token;
        String phone = redisTemplate.opsForValue().get(key);

        if(phone == null){
            throw new RuntimeException("Phone verification expired or invalid. Please verify your phone again");
        }

        //Delete after use - token is single-use
        redisTemplate.delete(key);
        return phone;
    }

    /**
     * Checks if a phone was recently verified (without consuming the token)
     * Used to show "phone verified on the registration screen.
     */
    public boolean isPhoneVerified(String phone){
        return redisTemplate.hasKey(VERIFIED_KEY_PREFIX + phone);
    }

    private String generateOtp(){
        SecureRandom random = new SecureRandom();
        int otp = random.nextInt(900000) + 100000;  //range
        return String.format("%06d", otp); //zero-pad to 6 digits
    }
}



























