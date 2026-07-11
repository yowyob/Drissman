package com.drissman.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/** Verdict serveur pour une opération hors ligne synchronisée. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SyncOperationResult {

    private UUID opId;
    /** SYNCED | ALREADY_PROCESSED | CONFLICT | INVALID | TEMPORARY_ERROR. */
    private String status;
    private String message;

    public static SyncOperationResult of(UUID opId, String status, String message) {
        return SyncOperationResult.builder().opId(opId).status(status).message(message).build();
    }
}
