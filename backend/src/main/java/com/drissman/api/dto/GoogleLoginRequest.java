package com.drissman.api.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class GoogleLoginRequest {
    @NotBlank(message = "L'idToken est requis")
    private String idToken;
}
