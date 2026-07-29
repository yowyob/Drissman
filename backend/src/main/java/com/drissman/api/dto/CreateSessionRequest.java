package com.drissman.api.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateSessionRequest {

    private List<UUID> offerIds;

    // Optional at creation time
    private List<UUID> monitorIds;

    @NotNull(message = "La date est obligatoire")
    private LocalDate date;

    @NotNull(message = "L'heure de début est obligatoire")
    private LocalTime startTime;

    @NotNull(message = "L'heure de fin est obligatoire")
    private LocalTime endTime;

    private String meetingPoint;

    private UUID moduleId;

    private UUID lessonId;
}
