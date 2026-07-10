package com.drissman.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
@Slf4j
public class ImageStorageService {

    private final Path root;

    public ImageStorageService(@Value("${app.upload.dir:uploads/images}") String uploadDir) {
        this.root = Paths.get(uploadDir);
        try {
            Files.createDirectories(root);
            log.info("Image upload directory initialized at: {}", root.toAbsolutePath());
        } catch (IOException e) {
            log.error(
                    "CRITICAL: Could not initialize folder for upload at: {}. Error: {}. The app will start but uploads will fail.",
                    root.toAbsolutePath(), e.getMessage());
        }
    }

    public Mono<String> save(FilePart file) {
        String filename = UUID.randomUUID().toString() + "_" + file.filename();
        return file.transferTo(root.resolve(filename))
                .thenReturn(filename);
    }

    /** Sauvegarde depuis un tableau d'octets (le contenu a déjà été lu). */
    public Mono<String> saveBytes(byte[] bytes, String originalFilename) {
        String safeName = originalFilename != null
                ? originalFilename.replaceAll("[^A-Za-z0-9._-]", "_")
                : "image";
        String filename = UUID.randomUUID() + "_" + safeName;
        return Mono.fromCallable(() -> {
            Files.write(root.resolve(filename), bytes);
            return filename;
        }).subscribeOn(reactor.core.scheduler.Schedulers.boundedElastic());
    }

    public Resource load(String filename) {
        try {
            Path file = root.resolve(filename);
            Resource resource = new UrlResource(file.toUri());

            if (resource.exists() || resource.isReadable()) {
                return resource;
            } else {
                throw new RuntimeException("Could not read the file!");
            }
        } catch (MalformedURLException e) {
            throw new RuntimeException("Error: " + e.getMessage());
        }
    }
}
