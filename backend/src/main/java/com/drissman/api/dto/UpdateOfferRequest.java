package com.drissman.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateOfferRequest {
    private String name;
    private String description;
    private Integer price;
    private Integer hours;
    private String permitType;
    private String imageUrl;
}
