package com.drissman.domain.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.LocalDateTime;
import java.util.UUID;

/** Point d'historique GPS d'un véhicule (P5). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("vehicle_positions")
public class VehiclePosition {

    @Id
    private UUID id;

    @Column("vehicle_id")
    private UUID vehicleId;

    private Double latitude;

    private Double longitude;

    @Column("recorded_at")
    private LocalDateTime recordedAt;
}
