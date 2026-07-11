package com.drissman.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/** Lot d'opérations créées hors ligne, envoyées par ordre de création. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SyncBatchRequest {

    private List<Operation> operations;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Operation {
        /** UUID généré côté client — sert de clé d'idempotence. */
        private UUID opId;
        /** SESSION_COMPLETE | VEHICLE_POSITION. */
        private String type;
        /** Date de création locale (traçabilité). */
        private String createdAt;
        /** Données utiles, spécifiques au type. */
        private Map<String, Object> payload;

        public String str(String key) {
            Object v = payload != null ? payload.get(key) : null;
            return v != null ? v.toString() : null;
        }

        public UUID uuid(String key) {
            try {
                String s = str(key);
                return s != null ? UUID.fromString(s) : null;
            } catch (IllegalArgumentException e) {
                return null;
            }
        }

        public Double dbl(String key) {
            Object v = payload != null ? payload.get(key) : null;
            if (v instanceof Number n) {
                return n.doubleValue();
            }
            try {
                return v != null ? Double.parseDouble(v.toString()) : null;
            } catch (NumberFormatException e) {
                return null;
            }
        }
    }
}
