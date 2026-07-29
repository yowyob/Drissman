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
@Table("users")
public class User {

    @Id
    private UUID id;

    private String email;

    private String password;

    @Column("first_name")
    private String firstName;

    @Column("last_name")
    private String lastName;

    private String phone;

    @Column("role")
    private Role role;

    @Column("school_id")
    private UUID schoolId;

    /** Identifiant du compte-miroir sur le kernel-core (yowyob). Null = pas encore synchronisé. */
    @Column("kernel_user_id")
    private UUID kernelUserId;

    @Column("avatar_url")
    private String avatarUrl;

    @Column("push_token")
    private String pushToken;

    @Column("is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column("created_at")
    private LocalDateTime createdAt;

    @Column("updated_at")
    private LocalDateTime updatedAt;

    public enum Role {
        VISITOR,
        CANDIDAT,
        STUDENT,
        SCHOOL_ADMIN,
        MONITOR,
        SUPER_ADMIN
    }
}
