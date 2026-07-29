package com.drissman.domain.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.domain.Persistable;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("documents")
public class Document implements Persistable<UUID> {
    @Id
    private UUID id;

    @Column("school_id")
    private UUID schoolId;

    @Column("uploader_id")
    private UUID uploaderId;

    @Column("enrollment_id")
    private UUID enrollmentId;

    private String title;
    
    @Column("file_type")
    private String fileType;
    
    private String category;
    
    @Column("file_url")
    private String fileUrl;
    
    @Column("file_size")
    private String fileSize;

    @Column("created_at")
    private LocalDateTime createdAt;

    @Transient
    @Builder.Default
    private boolean isNew = true;

    @Override
    public boolean isNew() {
        return isNew;
    }
}
