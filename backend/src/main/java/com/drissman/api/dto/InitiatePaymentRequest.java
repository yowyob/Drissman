package com.drissman.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InitiatePaymentRequest {

    @NotNull
    private UUID enrollmentId;

    /** MTN_MOMO, ORANGE_MONEY, CARD ou CASH (cf. Invoice.PaymentMethod). */
    @NotBlank
    private String method;

    /** Numéro Mobile Money du payeur (requis pour MTN_MOMO / ORANGE_MONEY). */
    private String phone;
}
