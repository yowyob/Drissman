package com.drissman.api.controller;

import com.drissman.api.dto.DocumentDto;
import com.drissman.domain.repository.UserRepository;
import com.drissman.service.DocumentService;
import com.drissman.service.ImageStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.http.codec.multipart.FormFieldPart;
import org.springframework.http.codec.multipart.Part;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.security.Principal;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;
    private final ImageStorageService storageService; // Reusing ImageStorageService to store files on disk
    private final UserRepository userRepository;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Mono<DocumentDto> uploadDocument(
            Principal principal,
            org.springframework.web.server.ServerWebExchange exchange) {

        if (principal == null) {
            log.error("[DocumentUpload] Failed: Principal is null");
            return Mono.error(new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        }
        UUID uploaderId;
        try {
            uploaderId = UUID.fromString(principal.getName());
        } catch (IllegalArgumentException e) {
            log.error("[DocumentUpload] Invalid principal UUID: {}", principal.getName());
            return Mono.error(new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid uploader ID format"));
        }

        return userRepository.findById(uploaderId)
                .switchIfEmpty(Mono.defer(() -> {
                    log.error("[DocumentUpload] User not found in database for ID: {}", uploaderId);
                    return Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
                }))
                .flatMap(user -> {
                    UUID schoolId = user.getSchoolId();
                    if (schoolId == null) {
                        log.warn("[DocumentUpload] User {} has no school associated, using fallback or denying", uploaderId);
                        return Mono.error(new ResponseStatusException(HttpStatus.FORBIDDEN, "Aucune auto-école associée à cet utilisateur"));
                    }
                    
                    return exchange.getMultipartData().flatMap(multipartData -> {
                        Part part = multipartData.getFirst("file");
                        if (part == null && !multipartData.isEmpty()) {
                            part = multipartData.values().iterator().next().get(0);
                        }
                        if (part == null) {
                            log.error("[DocumentUpload] Part 'file' missing");
                            return Mono.error(new ResponseStatusException(HttpStatus.BAD_REQUEST, "File is missing or invalid"));
                        }

                        String originalFilename = "document.pdf";
                        if (part instanceof FilePart) {
                            String fn = ((FilePart) part).filename();
                            if (fn != null && !fn.isBlank()) {
                                originalFilename = fn;
                            }
                        } else {
                            String cd = part.headers().getFirst(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION);
                            if (cd != null && cd.contains("filename=")) {
                                String fn = cd.substring(cd.indexOf("filename=") + 9).replace("\"", "").trim();
                                if (fn.contains(";")) {
                                    fn = fn.substring(0, fn.indexOf(";")).trim();
                                }
                                if (!fn.isBlank()) {
                                    originalFilename = fn;
                                }
                            }
                        }
                        
                        Part categoryPart = multipartData.getFirst("category");
                        String category = "Administratif";
                        if (categoryPart instanceof FormFieldPart) {
                            category = ((FormFieldPart) categoryPart).value();
                        }
                        
                        Part enrollmentIdPart = multipartData.getFirst("enrollmentId");
                        UUID enrollmentId = null;
                        if (enrollmentIdPart instanceof FormFieldPart) {
                            String value = ((FormFieldPart) enrollmentIdPart).value();
                            if (value != null && !value.isEmpty()) {
                                try {
                                    enrollmentId = UUID.fromString(value);
                                } catch (Exception ignored) {}
                            }
                        }
                        
                        UUID finalEnrollmentId = enrollmentId;
                        String finalCategory = category;
                        String finalFilename = originalFilename;
                        Part finalPart = part;
                        
                        return org.springframework.core.io.buffer.DataBufferUtils
                                .join(finalPart.content())
                                .flatMap(buffer -> {
                                    byte[] bytes = new byte[buffer.readableByteCount()];
                                    buffer.read(bytes);
                                    org.springframework.core.io.buffer.DataBufferUtils.release(buffer);
                                    long sizeBytes = bytes.length;
                                    
                                    return storageService.saveBytes(bytes, finalFilename)
                                            .flatMap(filename -> {
                                                String fileUrl = "/api/images/" + filename;
                                                return documentService.saveDocument(
                                                        uploaderId, 
                                                        schoolId, 
                                                        finalFilename, 
                                                        fileUrl, 
                                                        finalPart.headers().getContentType() != null ? finalPart.headers().getContentType().toString() : "application/pdf", 
                                                        sizeBytes, 
                                                        finalEnrollmentId, 
                                                        finalCategory
                                                );
                                            });
                                })
                                .doOnError(err -> log.error("[DocumentUpload] Error processing file content: {}", err.getMessage(), err));
                    });
                });
    }

    @GetMapping("/school")
    public Flux<DocumentDto> getSchoolDocuments(Principal principal) {
        if (principal == null) return Flux.empty();
        UUID userId = UUID.fromString(principal.getName());
        return userRepository.findById(userId)
                .flatMapMany(user -> {
                    if (user.getSchoolId() == null) return Flux.empty();
                    return documentService.getSchoolDocuments(user.getSchoolId());
                });
    }

    @GetMapping("/me")
    public Flux<DocumentDto> getMyDocuments(Principal principal) {
        if (principal == null) return Flux.empty();
        UUID userId = UUID.fromString(principal.getName());
        return documentService.getDocumentsForUser(userId);
    }
}
