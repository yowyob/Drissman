package com.drissman.kernel;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.Data;

/**
 * Enveloppe standard des réponses du kernel-core (yowyob).
 * Format : { success, data, message, errorCode, timestamp }
 */
@Data
public class KernelResponse {

    private boolean success;

    private JsonNode data;

    private String message;

    private String errorCode;

    private String timestamp;
}
