package com.drissman.api.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateMonitorRequest {

    @NotBlank(message = "Le prénom est obligatoire")
    private String firstName;

    @NotBlank(message = "Le nom de famille est obligatoire")
    private String lastName;

    // Optionnel : peut être vide si le permis n'est pas encore renseigné
    // (stocké NULL en base pour respecter l'unicité sans bloquer la création).
    private String licenseNumber;

    @NotBlank(message = "Le numéro de téléphone est obligatoire")
    private String phoneNumber;

    // Optional email and password if the admin wants to immediately provision an
    // account for them
    private String email;
    private String password;
}
