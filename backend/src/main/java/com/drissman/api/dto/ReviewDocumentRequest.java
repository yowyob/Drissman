package com.drissman.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Décision de revue d'une pièce par le super-admin : APPROVE | REJECT (+ note). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewDocumentRequest {
    private String decision;
    private String notes;
}
