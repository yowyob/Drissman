package com.drissman.api.controller;

import com.drissman.kernel.KernelFileService;
import com.drissman.service.ImageStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.security.Principal;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/images")
@RequiredArgsConstructor
public class ImageController {

    private final ImageStorageService storageService;
    private final KernelFileService kernelFileService;

    /**
     * Upload d'image (ex. présentation d'un cours) : stockage local pour le
     * service public + archivage dans le file-core kernel en arrière-plan.
     */
    @PostMapping("/upload")
    public Mono<ResponseEntity<Map<String, String>>> upload(
            Principal principal,
            @RequestPart("file") Mono<FilePart> filePartMono) {
        return filePartMono
                .flatMap(filePart -> org.springframework.core.io.buffer.DataBufferUtils
                        .join(filePart.content())
                        .map(buffer -> {
                            byte[] bytes = new byte[buffer.readableByteCount()];
                            buffer.read(bytes);
                            org.springframework.core.io.buffer.DataBufferUtils.release(buffer);
                            return bytes;
                        })
                        .flatMap(bytes -> storageService.saveBytes(bytes, filePart.filename())
                                .doOnNext(filename -> {
                                    if (principal != null) {
                                        String contentType = filePart.headers().getContentType() != null
                                                ? filePart.headers().getContentType().toString()
                                                : MediaType.IMAGE_JPEG_VALUE;
                                        kernelFileService.archiveInBackground(
                                                UUID.fromString(principal.getName()),
                                                bytes, filePart.filename(), contentType, "COURSE_IMAGE");
                                    }
                                })))
                .map(filename -> ResponseEntity.ok(Map.of("url", "/api/images/" + filename)));
    }

    @GetMapping("/{filename}")
    public ResponseEntity<Resource> getImage(@PathVariable String filename) {
        Resource file = storageService.load(filename);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + file.getFilename() + "\"")
                .contentType(MediaType.IMAGE_JPEG) // You might want to detect this dynamically
                .body(file);
    }
}
