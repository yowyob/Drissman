package com.drissman.api.controller;

import com.drissman.api.dto.TrainingPeriodViewDto;
import com.drissman.service.TrainingPeriodService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;

import java.util.UUID;

@RestController
@RequestMapping("/api/training-periods/published")
@RequiredArgsConstructor
public class PublicTrainingPeriodController {

    private final TrainingPeriodService trainingPeriodService;

    @GetMapping("/school/{schoolId}")
    public Flux<TrainingPeriodViewDto> listBySchool(@PathVariable UUID schoolId) {
        return trainingPeriodService.getPublishedBySchool(schoolId);
    }
}
