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
 * Pièce justificative d'une auto-école (KYC / Document-hub kernel).
 *
 * Le fichier est servi localement (fileUrl) et, best-effort, archivé dans le
 * file-core kernel (kernelFileId) puis rattaché au Document-hub
 * (kernelDocumentLinkId). Le statut local reste la source de vérité affichée.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("school_documents")
public class SchoolDocument {

    @Id
    private UUID id;

    @Column("school_id")
    private UUID schoolId;

    /** Moniteur concerné ; NULL = pièce de l'auto-école elle-même. */
    @Column("monitor_id")
    private UUID monitorId;

    private String category;

    private String label;

    @Column("file_url")
    private String fileUrl;

    @Column("kernel_file_id")
    private UUID kernelFileId;

    @Column("kernel_document_link_id")
    private UUID kernelDocumentLinkId;

    @Builder.Default
    private String status = "PENDING";

    @Column("review_notes")
    private String reviewNotes;

    @Column("created_at")
    private LocalDateTime createdAt;

    @Column("updated_at")
    private LocalDateTime updatedAt;

    /** Statut local d'une pièce. */
    public static final class Status {
        public static final String PENDING = "PENDING";
        public static final String VERIFIED = "VERIFIED";
        public static final String REJECTED = "REJECTED";
        private Status() {}
    }
}
