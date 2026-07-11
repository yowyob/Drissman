package com.drissman.service;

import com.drissman.domain.entity.Vehicle;
import com.drissman.domain.entity.VehiclePosition;
import com.drissman.domain.repository.VehiclePositionRepository;
import com.drissman.domain.repository.VehicleRepository;
import com.drissman.kernel.KernelResourceService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * P5 : la géolocalisation n'est plus conditionnée au type de séance
 * (l'autorisation par rôle est assurée par SecurityConfig). Seule la validation
 * des coordonnées reste dans le service.
 */
@ExtendWith(MockitoExtension.class)
class VehicleServiceTest {

    @Mock
    private VehicleRepository vehicleRepository;
    @Mock
    private VehiclePositionRepository positionRepository;
    @Mock
    private KernelResourceService kernelResourceService;

    @InjectMocks
    private VehicleService vehicleService;

    private UUID userId;
    private UUID vehicleId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        vehicleId = UUID.randomUUID();
    }

    @Test
    void updatePosition_shouldRejectInvalidCoordinates() {
        StepVerifier.create(vehicleService.updatePosition(vehicleId, 120, 200, userId))
                .expectErrorMatches(e -> e instanceof ResponseStatusException
                        && ((ResponseStatusException) e).getStatusCode().value() == 400)
                .verify();
        verify(vehicleRepository, never()).save(any());
    }

    @Test
    void updatePosition_shouldAcceptWithoutSessionConstraint() {
        when(vehicleRepository.findById(vehicleId)).thenReturn(Mono.just(
                Vehicle.builder().id(vehicleId).schoolId(UUID.randomUUID()).build()));
        when(positionRepository.save(any(VehiclePosition.class)))
                .thenAnswer(inv -> Mono.just(inv.getArgument(0, VehiclePosition.class)));
        when(vehicleRepository.save(any(Vehicle.class)))
                .thenAnswer(inv -> Mono.just(inv.getArgument(0, Vehicle.class)));

        StepVerifier.create(vehicleService.updatePosition(vehicleId, 3.85, 11.5, userId))
                .assertNext(dto -> {
                    org.junit.jupiter.api.Assertions.assertEquals(3.85, dto.getLatitude());
                    org.junit.jupiter.api.Assertions.assertEquals(11.5, dto.getLongitude());
                })
                .verifyComplete();
    }

    @Test
    void updatePosition_shouldFailWhenVehicleNotFound() {
        when(vehicleRepository.findById(vehicleId)).thenReturn(Mono.empty());

        StepVerifier.create(vehicleService.updatePosition(vehicleId, 3.85, 11.5, userId))
                .expectErrorMatches(e -> e instanceof ResponseStatusException
                        && ((ResponseStatusException) e).getStatusCode().value() == 404)
                .verify();
    }
}
