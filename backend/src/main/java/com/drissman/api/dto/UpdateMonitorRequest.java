package com.drissman.api.dto;

import com.drissman.domain.entity.Monitor.MonitorStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateMonitorRequest {
    private String firstName;
    private String lastName;
    private String email;
    private String password;
    private String licenseNumber;
    private String phoneNumber;
    private MonitorStatus status;
}
