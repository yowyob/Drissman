package com.drissman.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentDto {

    private UUID id;

    private UUID enrollmentId;

    /** Renseignés sur la vue école (liste des paiements reçus). */
    private String studentName;

    private String offerName;

    private Integer amount;

    private String status;

    private String method;

    private String phone;

    private String reference;

    private LocalDateTime createdAt;

    private LocalDateTime paidAt;

    /** URL Stripe Checkout à ouvrir pour payer par carte (transitoire). */
    private String checkoutUrl;
}
