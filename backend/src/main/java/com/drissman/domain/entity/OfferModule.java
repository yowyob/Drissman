package com.drissman.domain.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * OfferModule entity — Pivot table linking Offers (formations) to Modules.
 * Each offer can contain multiple modules in a defined order.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("offer_modules")
public class OfferModule {

    @Id
    private UUID id;

    @Column("offer_id")
    private UUID offerId;

    @Column("module_id")
    private UUID moduleId;

    @Column("order_index")
    @Builder.Default
    private Integer orderIndex = 0;

    @Column("created_at")
    private LocalDateTime createdAt;
}
