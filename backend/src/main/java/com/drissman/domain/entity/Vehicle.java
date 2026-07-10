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

/**
 * Véhicule d'une auto-école, suivi en temps réel (P5).
 * Pendant kernel : une Resource du resource-core (kernel_resource_id).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("vehicles")
public class Vehicle {

    @Id
    private UUID id;

    @Column("school_id")
    private UUID schoolId;

    /** Moniteur actuellement affecté (nullable). */
    @Column("monitor_id")
    private UUID monitorId;

    private String name;

    @Column("plate_number")
    private String plateNumber;

    /** Dernière position connue (dénormalisée pour lecture rapide). */
    private Double latitude;

    private Double longitude;

    @Column("last_position_at")
    private LocalDateTime lastPositionAt;

    /** Resource correspondante dans le resource-core kernel. */
    @Column("kernel_resource_id")
    private UUID kernelResourceId;

    @Column("is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column("created_at")
    private LocalDateTime createdAt;
}
