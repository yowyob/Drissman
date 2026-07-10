package com.drissman.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateModuleRequest {

    @NotBlank
    private String name;

    @NotNull
    private String category = "CODE";

    private String description;

    private Integer orderIndex = 0;

    private Integer requiredHours = 1;
}
