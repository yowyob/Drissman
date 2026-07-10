package com.drissman.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * DTO representing a module within an offer (formation), with ordering info.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OfferModuleDto {
    private UUID id;
    private UUID offerId;
    private UUID moduleId;
    private Integer orderIndex;

    // Enriched fields from Module join
    private String moduleName;
    private String moduleCategory;
    private String moduleDescription;
    private Integer moduleRequiredHours;
}
