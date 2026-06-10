package com.rideshare.ride_service.Repository;

import com.rideshare.ride_service.Model.Rider;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RiderRepository extends JpaRepository<Rider, String> {
    boolean existsByPhone(String phone);
}
