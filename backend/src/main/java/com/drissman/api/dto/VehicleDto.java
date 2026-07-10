package com.drissman.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VehicleDto {

    private UUID id;

    private UUID schoolId;

    private UUID monitorId;

    private String name;

    private String plateNumber;

    private Double latitude;

    private Double longitude;

    private LocalDateTime lastPositionAt;

    private Boolean isActive;
}
