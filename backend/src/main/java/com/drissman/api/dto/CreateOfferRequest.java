package com.drissman.api.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateOfferRequest {
    private UUID schoolId;

    @NotBlank
    private String name;

    private String description;

    @NotNull
    @Min(0)
    private Integer price;

    @NotNull
    @Min(1)
    private Integer hours;

    @NotBlank
    private String permitType;

    /** URL de l'image de présentation (obtenue via POST /api/images/upload). */
    private String imageUrl;

    private List<UUID> monitorIds;
}
