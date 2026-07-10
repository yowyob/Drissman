package com.drissman.api.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalTime;
import java.util.UUID;

@Data
public class CreateAvailabilityRequest {
    @NotNull
    private UUID schoolId;

    @NotNull
    @Min(1)
    @Max(7)
    private Integer dayOfWeek; // 1=Monday, 7=Sunday

    @NotNull
    private LocalTime startTime;

    @NotNull
    private LocalTime endTime;

    @Min(1)
    private Integer maxBookings = 1;
}
