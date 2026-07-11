package com.drissman.service;

import com.drissman.api.dto.SessionDto;
import com.drissman.api.dto.SyncBatchRequest;
import com.drissman.domain.entity.Session;
import com.drissman.domain.entity.SyncOperation;
import com.drissman.domain.repository.SessionRepository;
import com.drissman.domain.repository.SyncOperationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Garanties du mode hors ligne : idempotence (un rejeu ne ré-exécute pas),
 * détection de conflit (pas de « dernière écriture gagnante ») et rejet
 * structuré des opérations invalides.
 */
@ExtendWith(MockitoExtension.class)
class SyncServiceTest {

    @Mock
    private SyncOperationRepository syncOperationRepository;
    @Mock
    private SessionRepository sessionRepository;
    @Mock
    private SessionService sessionService;
    @Mock
    private VehicleService vehicleService;

    @InjectMocks
    private SyncService syncService;

    private UUID userId;
    private UUID opId;
    private UUID sessionId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        opId = UUID.randomUUID();
        sessionId = UUID.randomUUID();
    }

    private SyncBatchRequest batchOf(SyncBatchRequest.Operation... ops) {
        return SyncBatchRequest.builder().operations(List.of(ops)).build();
    }

    private SyncBatchRequest.Operation completeOp(String baseStatus) {
        return SyncBatchRequest.Operation.builder()
                .opId(opId)
                .type(SyncService.OP_SESSION_COMPLETE)
                .payload(Map.of("sessionId", sessionId.toString(), "notes", "RAS",
                        "baseStatus", baseStatus))
                .build();
    }

    @Test
    void replayedOperation_shouldReturnRecordedResult_withoutReExecution() {
        when(syncOperationRepository.findById(opId)).thenReturn(Mono.just(SyncOperation.builder()
                .id(opId).userId(userId).opType(SyncService.OP_SESSION_COMPLETE)
                .resultStatus("SYNCED").build()));

        StepVerifier.create(syncService.processBatch(userId, batchOf(completeOp("SCHEDULED"))))
                .assertNext(r -> assertEquals("ALREADY_PROCESSED", r.getStatus()))
                .verifyComplete();

        verify(sessionService, never()).completeSessionByMonitor(any(), any(), any());
        verify(syncOperationRepository, never()).save(any());
    }

    @Test
    void sessionAlreadyCompletedOnServer_shouldReportConflict_notOverwrite() {
        when(syncOperationRepository.findById(opId)).thenReturn(Mono.empty());
        when(sessionRepository.findById(sessionId)).thenReturn(Mono.just(Session.builder()
                .id(sessionId).status(Session.SessionStatus.COMPLETED).build()));
        when(syncOperationRepository.save(any(SyncOperation.class)))
                .thenAnswer(inv -> Mono.just(inv.getArgument(0, SyncOperation.class)));

        StepVerifier.create(syncService.processBatch(userId, batchOf(completeOp("SCHEDULED"))))
                .assertNext(r -> assertEquals("CONFLICT", r.getStatus()))
                .verifyComplete();

        verify(sessionService, never()).completeSessionByMonitor(any(), any(), any());
    }

    @Test
    void sessionChangedSinceLastSync_shouldReportConflict() {
        when(syncOperationRepository.findById(opId)).thenReturn(Mono.empty());
        // Le client connaissait SCHEDULED ; le gérant a annulé entre-temps.
        when(sessionRepository.findById(sessionId)).thenReturn(Mono.just(Session.builder()
                .id(sessionId).status(Session.SessionStatus.CANCELLED).build()));
        when(syncOperationRepository.save(any(SyncOperation.class)))
                .thenAnswer(inv -> Mono.just(inv.getArgument(0, SyncOperation.class)));

        StepVerifier.create(syncService.processBatch(userId, batchOf(completeOp("SCHEDULED"))))
                .assertNext(r -> assertEquals("CONFLICT", r.getStatus()))
                .verifyComplete();
    }

    @Test
    void firstExecution_shouldCompleteSession_andRecordIdempotencyKey() {
        when(syncOperationRepository.findById(opId)).thenReturn(Mono.empty());
        when(sessionRepository.findById(sessionId)).thenReturn(Mono.just(Session.builder()
                .id(sessionId).status(Session.SessionStatus.SCHEDULED).build()));
        when(sessionService.completeSessionByMonitor(userId, sessionId, "RAS"))
                .thenReturn(Mono.just(SessionDto.builder().id(sessionId).build()));
        when(syncOperationRepository.save(any(SyncOperation.class)))
                .thenAnswer(inv -> Mono.just(inv.getArgument(0, SyncOperation.class)));

        StepVerifier.create(syncService.processBatch(userId, batchOf(completeOp("SCHEDULED"))))
                .assertNext(r -> assertEquals("SYNCED", r.getStatus()))
                .verifyComplete();

        verify(syncOperationRepository).save(any(SyncOperation.class));
    }

    @Test
    void unknownOperationType_shouldBeInvalid() {
        when(syncOperationRepository.findById(opId)).thenReturn(Mono.empty());
        when(syncOperationRepository.save(any(SyncOperation.class)))
                .thenAnswer(inv -> Mono.just(inv.getArgument(0, SyncOperation.class)));

        SyncBatchRequest.Operation op = SyncBatchRequest.Operation.builder()
                .opId(opId).type("PAYMENT_CONFIRM").payload(Map.of()).build();

        StepVerifier.create(syncService.processBatch(userId, batchOf(op)))
                .assertNext(r -> assertEquals("INVALID", r.getStatus()))
                .verifyComplete();
    }
}
