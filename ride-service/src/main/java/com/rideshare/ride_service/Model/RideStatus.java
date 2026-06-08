package com.rideshare.ride_service.Model;

/**
 * REQUESTED -> MATCHING -> ACCEPTED -> DRIVER_ARRIVING
 *           -> RIDE_STARTED -> COMPLETED
 *           -> CANCELLED (can happen at multiple stages)
 */


public enum RideStatus {
    REQUESTED,
    MATCHING,
    ACCEPTED,
    DRIVER_ARRIVING,
    RIDE_STARTED,
    COMPLETED,
    CANCELLED,
    PAYMENT_SETTLED
}
