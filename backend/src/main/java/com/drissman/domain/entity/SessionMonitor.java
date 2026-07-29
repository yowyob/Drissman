package com.drissman.domain.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * SessionMonitor - Links a Session to a Monitor.
 * 
 * Enables 1 Session = N Monitors.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("session_monitors")
public class SessionMonitor {

    @Id
    private UUID id;

    @Column("session_id")
    private UUID sessionId;

    @Column("monitor_id")
    private UUID monitorId;

    @Column("created_at")
    private LocalDateTime createdAt;
}
