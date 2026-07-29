package com.drissman.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentDto {
    private UUID id;
    private String title;
    private String type; // e.g., pdf, png
    private String category; // e.g., Administratif, Pédagogique
    private String fileUrl;
    private String fileSize;
    private LocalDateTime date;
}
