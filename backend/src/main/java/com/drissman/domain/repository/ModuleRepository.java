package com.drissman.domain.repository;

import com.drissman.domain.entity.Module;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

import java.util.UUID;

@Repository
public interface ModuleRepository extends R2dbcRepository<Module, UUID> {
    Flux<Module> findBySchoolIdOrderByOrderIndexAsc(UUID schoolId);

    Flux<Module> findBySchoolIdAndCategory(UUID schoolId, Module.ModuleCategory category);
}
