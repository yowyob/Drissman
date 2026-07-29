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

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("offer_monitors")
public class OfferMonitor {

    @Id
    private UUID id;

    @Column("offer_id")
    private UUID offerId;

    @Column("monitor_id")
    private UUID monitorId;

    @Column("created_at")
    private LocalDateTime createdAt;
}
