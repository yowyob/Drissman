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
@Table("invoices")
public class Invoice {

    @Id
    private UUID id;

    @Column("booking_id")
    private UUID bookingId;

    @Column("enrollment_id")
    private UUID enrollmentId;

    @Column("user_id")
    private UUID userId;

    @Column("school_id")
    private UUID schoolId;

    private Integer amount;

    private InvoiceStatus status;

    @Column("payment_method")
    private PaymentMethod paymentMethod;

    @Column("payment_reference")
    private String paymentReference;

    @Column("payment_phone")
    private String paymentPhone;

    /** Référence de la transaction chez le prestataire (Yowyob Payment / Stripe). */
    @Column("provider_reference")
    private String providerReference;

    @Column("created_at")
    private LocalDateTime createdAt;

    @Column("paid_at")
    private LocalDateTime paidAt;

    public enum InvoiceStatus {
        PENDING,
        PAID,
        FAILED,
        REFUNDED
    }

    public enum PaymentMethod {
        MTN_MOMO,
        ORANGE_MONEY,
        CARD,
        CASH
    }
}
