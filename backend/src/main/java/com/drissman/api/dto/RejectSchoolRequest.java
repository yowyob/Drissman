package com.drissman.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Corps de la requête de rejet d'une auto-école (motif obligatoire). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RejectSchoolRequest {
    private String reason;
}
