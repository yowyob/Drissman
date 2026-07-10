package com.drissman.service;

import com.drissman.api.dto.CreateModuleRequest;
import com.drissman.api.dto.ModuleDto;
import com.drissman.domain.entity.Module;
import com.drissman.domain.repository.ModuleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ModuleService {

    private final ModuleRepository moduleRepository;

    public Flux<ModuleDto> getModules(UUID schoolId) {
        return moduleRepository.findBySchoolIdOrderByOrderIndexAsc(schoolId)
                .map(this::toDto);
    }

    public Mono<ModuleDto> createModule(UUID schoolId, CreateModuleRequest request) {
        Module.ModuleCategory category;
        try {
            category = Module.ModuleCategory.valueOf(request.getCategory().toUpperCase());
        } catch (IllegalArgumentException e) {
            category = Module.ModuleCategory.CODE;
        }

        Module module = Module.builder()
                .schoolId(schoolId)
                .name(request.getName())
                .category(category)
                .description(request.getDescription())
                .orderIndex(request.getOrderIndex())
                .requiredHours(request.getRequiredHours())
                .createdAt(LocalDateTime.now())
                .build();

        return moduleRepository.save(module).map(this::toDto);
    }

    public Mono<ModuleDto> updateModule(UUID moduleId, UUID schoolId, CreateModuleRequest request) {
        return moduleRepository.findById(moduleId)
                .filter(module -> schoolId.equals(module.getSchoolId()))
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Module non trouve")))
                .flatMap(existing -> {
                    existing.setName(request.getName());
                    existing.setDescription(request.getDescription());
                    existing.setOrderIndex(request.getOrderIndex());
                    existing.setRequiredHours(request.getRequiredHours());

                    try {
                        existing.setCategory(Module.ModuleCategory.valueOf(request.getCategory().toUpperCase()));
                    } catch (IllegalArgumentException e) {
                        // keep existing category
                    }

                    return moduleRepository.save(existing);
                })
                .map(this::toDto);
    }

    public Mono<Void> deleteModule(UUID moduleId, UUID schoolId) {
        return moduleRepository.findById(moduleId)
                .filter(module -> schoolId.equals(module.getSchoolId()))
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Module non trouve")))
                .flatMap(moduleRepository::delete);
    }

    private ModuleDto toDto(Module module) {
        return ModuleDto.builder()
                .id(module.getId())
                .name(module.getName())
                .category(module.getCategory() != null ? module.getCategory().name() : "CODE")
                .description(module.getDescription())
                .orderIndex(module.getOrderIndex())
                .requiredHours(module.getRequiredHours())
                .build();
    }
}
