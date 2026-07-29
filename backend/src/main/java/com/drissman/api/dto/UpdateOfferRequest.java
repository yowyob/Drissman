package com.drissman.api.dto;

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
public class UpdateOfferRequest {
    private String name;
    private String description;
    private Integer price;
    private Integer hours;
    private String permitType;
    private String imageUrl;
    private List<UUID> monitorIds;
}
