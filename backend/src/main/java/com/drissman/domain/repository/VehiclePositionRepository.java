package com.drissman.domain.repository;

import com.drissman.domain.entity.VehiclePosition;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;

import java.util.UUID;

public interface VehiclePositionRepository extends ReactiveCrudRepository<VehiclePosition, UUID> {

    @Query("SELECT * FROM vehicle_positions WHERE vehicle_id = :vehicleId ORDER BY recorded_at DESC LIMIT :limit")
    Flux<VehiclePosition> findRecentByVehicleId(UUID vehicleId, int limit);
}
