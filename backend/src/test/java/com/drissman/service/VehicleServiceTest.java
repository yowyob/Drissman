package com.drissman.service;

import com.drissman.domain.entity.Monitor;
import com.drissman.domain.entity.User;
import com.drissman.domain.entity.Vehicle;
import com.drissman.domain.entity.VehiclePosition;
import com.drissman.domain.repository.MonitorRepository;
import com.drissman.domain.repository.SessionRepository;
import com.drissman.domain.repository.UserRepository;
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
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Garde métier P5 : un MONITEUR ne partage sa position que pendant une séance
 * de conduite/examen blanc en cours ; l'admin école n'est pas restreint.
 */
@ExtendWith(MockitoExtension.class)
class VehicleServiceTest {

    @Mock
    private VehicleRepository vehicleRepository;
    @Mock
    private VehiclePositionRepository positionRepository;
    @Mock
    private KernelResourceService kernelResourceService;
    @Mock
    private UserRepository userRepository;
    @Mock
    private MonitorRepository monitorRepository;
    @Mock
    private SessionRepository sessionRepository;

    @InjectMocks
    private VehicleService vehicleService;

    private UUID userId;
    private UUID vehicleId;
    private UUID monitorId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        vehicleId = UUID.randomUUID();
        monitorId = UUID.randomUUID();
    }

    private void stubVehicleSave() {
        Vehicle vehicle = Vehicle.builder().id(vehicleId).schoolId(UUID.randomUUID()).build();
        when(vehicleRepository.findById(vehicleId)).thenReturn(Mono.just(vehicle));
        when(positionRepository.save(any(VehiclePosition.class)))
                .thenAnswer(inv -> Mono.just(inv.getArgument(0, VehiclePosition.class)));
        when(vehicleRepository.save(any(Vehicle.class)))
                .thenAnswer(inv -> Mono.just(inv.getArgument(0, Vehicle.class)));
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
    void updatePosition_shouldRejectMonitorWithoutActiveDrivingSession() {
        when(userRepository.findById(userId)).thenReturn(Mono.just(
                User.builder().id(userId).role(User.Role.MONITOR).build()));
        when(monitorRepository.findByUserId(userId)).thenReturn(Mono.just(
                Monitor.builder().id(monitorId).build()));
        when(sessionRepository.countActiveDrivingSessions(monitorId)).thenReturn(Mono.just(0L));
        // findById est évalué à l'assemblage du chaînage (.then(...)) même si la
        // garde échoue avant tout abonnement : on le stube pour éviter un null.
        when(vehicleRepository.findById(vehicleId)).thenReturn(Mono.just(
                Vehicle.builder().id(vehicleId).schoolId(UUID.randomUUID()).build()));

        StepVerifier.create(vehicleService.updatePosition(vehicleId, 3.85, 11.5, userId))
                .expectErrorMatches(e -> e instanceof ResponseStatusException
                        && ((ResponseStatusException) e).getStatusCode().value() == 403)
                .verify();
        verify(vehicleRepository, never()).save(any());
    }

    @Test
    void updatePosition_shouldAcceptMonitorWithActiveDrivingSession() {
        when(userRepository.findById(userId)).thenReturn(Mono.just(
                User.builder().id(userId).role(User.Role.MONITOR).build()));
        when(monitorRepository.findByUserId(userId)).thenReturn(Mono.just(
                Monitor.builder().id(monitorId).build()));
        when(sessionRepository.countActiveDrivingSessions(monitorId)).thenReturn(Mono.just(1L));
        stubVehicleSave();

        StepVerifier.create(vehicleService.updatePosition(vehicleId, 3.85, 11.5, userId))
                .assertNext(dto -> {
                    org.junit.jupiter.api.Assertions.assertEquals(3.85, dto.getLatitude());
                    org.junit.jupiter.api.Assertions.assertEquals(11.5, dto.getLongitude());
                })
                .verifyComplete();
    }

    @Test
    void updatePosition_shouldAcceptSchoolAdminWithoutSession() {
        when(userRepository.findById(userId)).thenReturn(Mono.just(
                User.builder().id(userId).role(User.Role.SCHOOL_ADMIN).build()));
        // L'admin n'est pas restreint : aucune vérification de séance.
        lenient().when(monitorRepository.findByUserId(any())).thenReturn(Mono.empty());
        stubVehicleSave();

        StepVerifier.create(vehicleService.updatePosition(vehicleId, 3.85, 11.5, userId))
                .assertNext(dto -> org.junit.jupiter.api.Assertions.assertEquals(3.85, dto.getLatitude()))
                .verifyComplete();

        verify(monitorRepository, never()).findByUserId(any());
    }
}
