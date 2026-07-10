package com.drissman.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ModuleDto {
    private UUID id;
    private String name;
    private String category;
    private String description;
    private Integer orderIndex;
    private Integer requiredHours;
    private Integer scheduledHours;
}
