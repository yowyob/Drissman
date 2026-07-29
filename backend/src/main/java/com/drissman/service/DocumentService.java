package com.drissman.service;

import com.drissman.api.dto.DocumentDto;
import com.drissman.domain.entity.Document;
import com.drissman.domain.entity.User;
import com.drissman.domain.repository.DocumentRepository;
import com.drissman.domain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final UserRepository userRepository;

    public Mono<DocumentDto> saveDocument(UUID uploaderId, UUID schoolId, String filename, String fileUrl, String mimeType, long sizeBytes, UUID enrollmentId, String category) {
        String ext = filename.contains(".") ? filename.substring(filename.lastIndexOf('.') + 1).toUpperCase() : "FILE";
        String formattedSize = formatSize(sizeBytes);
        String cat = category != null && !category.isEmpty() ? category : "Général";

        Document doc = Document.builder()
                .id(UUID.randomUUID())
                .schoolId(schoolId)
                .uploaderId(uploaderId)
                .enrollmentId(enrollmentId)
                .title(filename)
                .fileType(ext)
                .category(cat)
                .fileUrl(fileUrl)
                .fileSize(formattedSize)
                .createdAt(LocalDateTime.now())
                .build();

        return documentRepository.save(doc).map(this::mapToDto);
    }

    public Flux<DocumentDto> getSchoolDocuments(UUID schoolId) {
        // Return global school documents (enrollmentId is null)
        return documentRepository.findBySchoolId(schoolId)
                .filter(d -> d.getEnrollmentId() == null)
                .map(this::mapToDto);
    }
    
    public Flux<DocumentDto> getDocumentsForUser(UUID userId) {
        return userRepository.findById(userId)
                .flatMapMany(user -> {
                    if (user.getSchoolId() == null) {
                        return Flux.empty();
                    }
                    // For student/monitor, they can see global school documents
                    // In a more advanced implementation, students could see their specific enrollment docs too
                    return documentRepository.findBySchoolId(user.getSchoolId())
                            .filter(d -> d.getEnrollmentId() == null)
                            .map(this::mapToDto);
                });
    }

    private DocumentDto mapToDto(Document doc) {
        return DocumentDto.builder()
                .id(doc.getId())
                .title(doc.getTitle())
                .type(doc.getFileType())
                .category(doc.getCategory())
                .fileUrl(doc.getFileUrl())
                .fileSize(doc.getFileSize())
                .date(doc.getCreatedAt())
                .build();
    }

    private String formatSize(long sizeBytes) {
        if (sizeBytes < 1024) return sizeBytes + " B";
        if (sizeBytes < 1024 * 1024) return (sizeBytes / 1024) + " KB";
        return String.format("%.1f MB", (double) sizeBytes / (1024 * 1024));
    }
}
