package com.drissman.api.dto;

import lombok.Data;

import java.util.List;
import java.util.UUID;

/**
 * Request payload to set modules for an offer (replaces the whole list).
 */
@Data
public class SetOfferModulesRequest {
    private List<ModuleEntry> modules;

    @Data
    public static class ModuleEntry {
        private UUID moduleId;
        private Integer orderIndex;
    }
}
