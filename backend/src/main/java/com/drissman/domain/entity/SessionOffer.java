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
 * SessionOffer - Links a TrainingPeriod (Session) to an Offer (Formation).
 * 
 * Enables 1 Session = N Formations. Optionally overrides
 * the offer's default price or max students for this session.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("session_offers")
public class SessionOffer {

    @Id
    private UUID id;

    @Column("training_period_id")
    private UUID trainingPeriodId;

    @Column("offer_id")
    private UUID offerId;

    @Column("max_students_override")
    private Integer maxStudentsOverride;

    @Column("price_override")
    private Integer priceOverride;

    @Column("created_at")
    private LocalDateTime createdAt;
}
