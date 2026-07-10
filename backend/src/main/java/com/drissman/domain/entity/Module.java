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

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("modules")
public class Module {

    @Id
    private UUID id;

    @Column("school_id")
    private UUID schoolId;

    private String name;

    private ModuleCategory category;

    private String description;

    @Column("order_index")
    private Integer orderIndex;

    @Column("required_hours")
    private Integer requiredHours;

    @Column("created_at")
    private LocalDateTime createdAt;

    public enum ModuleCategory {
        CODE,
        CONDUITE,
        EXAMEN_BLANC
    }
}
