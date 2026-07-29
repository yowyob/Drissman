package com.drissman.api.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class GoogleTokenInfo {
    private String iss;
    private String azp;
    private String aud;
    private String sub;
    private String email;
    @JsonProperty("email_verified")
    private String emailVerified;
    private String name;
    private String picture;
    @JsonProperty("given_name")
    private String givenName;
    @JsonProperty("family_name")
    private String familyName;
    private String locale;
}
