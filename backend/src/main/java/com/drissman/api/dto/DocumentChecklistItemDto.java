package com.drissman.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Une ligne de la checklist documentaire d'une auto-école : une catégorie
 * attendue et l'état de la pièce fournie (le cas échéant).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentChecklistItemDto {

    private String category;
    private String label;
    private boolean required;

    /** MISSING | PENDING | VERIFIED | REJECTED */
    private String status;

    private UUID documentId;
    private String fileUrl;
    private String reviewNotes;
    private LocalDateTime uploadedAt;
}
