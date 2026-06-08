package com.rideShare.auth_service.Service;

import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class TwilioSMSService {

    @Value("${twilio.from.number}")
    private String fromNumber;


    public void sendSms(String toPhone, String message){

        try{
            String fromattedPhone = formatPhone(toPhone);

            log.info("Sending SMS to: {}", fromattedPhone);

            Message twilioMessage = Message.creator(
                    new PhoneNumber(fromattedPhone),
                    new PhoneNumber(fromNumber),
                    message).create();
            log.info("SMS sent with SID: {}", twilioMessage.getSid());
        }catch (Exception e){
            //Don't crash the whole request if SMS fails

            log.error("Failed to send SMS to {}: {}", toPhone, e.getMessage());
        }
    }

    private String formatPhone(String phone){

        phone = phone.replaceAll("[\\s-]", "");

        //Already has + prefix - assume correct international format
        if(phone.startsWith("+")){
            return phone;
        }

        //Remove leading 0(Indian STD format)
        if(phone.startsWith("0")){
            phone = phone.substring(1);
        }

        //10-digit Indian number - add +91
        if(phone.length() == 10){
            return "+91" + phone;
        }

        //Return as-is for other formats
        return "+" + phone;
    }
}
