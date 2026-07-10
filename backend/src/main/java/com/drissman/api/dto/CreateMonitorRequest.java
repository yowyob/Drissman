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

    @NotBlank(message = "Le numéro de permis/licence est obligatoire")
    private String licenseNumber;

    @NotBlank(message = "Le numéro de téléphone est obligatoire")
    private String phoneNumber;

    // Optional email and password if the admin wants to immediately provision an
    // account for them
    private String email;
    private String password;
}
