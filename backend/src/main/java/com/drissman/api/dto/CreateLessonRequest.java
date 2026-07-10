package com.drissman.api.dto;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

@Data
public class CreateLessonRequest {

    private UUID monitorId;

    @NotNull
    @FutureOrPresent
    private LocalDate date;

    @NotNull
    private LocalTime startTime;

    @NotNull
    private LocalTime endTime;

    @NotBlank
    private String topic;

    private String lessonType = "CODE";

    private UUID moduleId;

    private String description;

    private String roomId;

    private Integer capacity = 20;

    private UUID trainingPeriodId;
}
