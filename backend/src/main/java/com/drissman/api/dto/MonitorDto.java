package com.drissman.api.dto;

import com.drissman.domain.entity.Monitor.MonitorStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MonitorDto {
    private UUID id;
    private UUID schoolId;
    private String schoolName;
    private String firstName;
    private String lastName;
    private String email;
    private String licenseNumber;
    private String phoneNumber;
    private UUID userId; // Linked user account ID (can login)
    private MonitorStatus status;
}
