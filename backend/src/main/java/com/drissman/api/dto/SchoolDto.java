package com.drissman.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SchoolDto {
    private UUID id;
    private String name;
    private String description;
    private String address;
    private String city;
    private String phone;
    private String email;
    private BigDecimal rating;
    private String imageUrl;
    private Double latitude;
    private Double longitude;
    private Integer minPrice;
    private Boolean isVerified;
    private Long reviewCount;
    private List<OfferDto> offers;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OfferDto {
        private UUID id;
        private String name;
        private String description;
        private Integer price;
        private Integer hours;
        private String permitType;
        private String imageUrl;
        private List<UUID> monitorIds;
    }
}
