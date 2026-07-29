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
public class SendMessageRequest {

    @NotNull(message = "L'identifiant du destinataire est obligatoire")
    private UUID recipientId;

    private UUID offerId;

    @NotBlank(message = "Le message ne peut pas être vide")
    private String content;
}
