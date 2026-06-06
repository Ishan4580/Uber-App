package com.rideShare.auth_service.Config;

import com.twilio.Twilio;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
@Slf4j
public class TwilioConfig {

    @Value("${twilio.accountSid}")
    private String accountSid;

    @Value("${twilio.authToken}")
    private String authToken;

    /**
     * @PostConstruct was ONCE when spring starts up, after all beans are created
     *
     * Twilio.init() initializes the Twilio SDK globally.
     * After this, anywhere in the code you can call:
     *      Message.creator(...).create();
     *      without passing credentials each time.
     */

    @PostConstruct
    public void initTwilio(){
        Twilio.init(accountSid, authToken);
        log.info("Twilio SDK initialized successfully");
    }
}
