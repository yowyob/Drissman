package com.drissman.service;

import com.drissman.api.dto.CreateMonitorRequest;
import com.drissman.api.dto.MonitorDto;
import com.drissman.api.dto.UpdateMonitorRequest;
import com.drissman.domain.entity.Monitor;
import com.drissman.domain.entity.User;
import com.drissman.domain.repository.MonitorRepository;
import com.drissman.domain.repository.SchoolRepository;
import com.drissman.domain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class MonitorService {

    private final MonitorRepository monitorRepository;
    private final UserRepository userRepository;
    private final SchoolRepository schoolRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public Mono<MonitorDto> createMonitor(UUID schoolId, CreateMonitorRequest request) {
        String normalizedEmail = request.getEmail() != null ? request.getEmail().trim().toLowerCase() : null;
        String normalizedPassword = request.getPassword() != null ? request.getPassword().trim() : null;

        if (normalizedEmail != null && !normalizedEmail.isBlank() &&
                normalizedPassword != null && !normalizedPassword.isBlank()) {

            User newUser = User.builder()
                    .schoolId(schoolId)
                    .email(normalizedEmail)
                    .password(passwordEncoder.encode(normalizedPassword))
                    .firstName(request.getFirstName() != null ? request.getFirstName().trim() : null)
                    .lastName(request.getLastName() != null ? request.getLastName().trim() : null)
                    .role(User.Role.MONITOR)
                    .createdAt(LocalDateTime.now())
                    .build();

            return userRepository.save(newUser)
                    .onErrorResume(org.springframework.dao.DuplicateKeyException.class, e -> Mono.error(
                            new ResponseStatusException(HttpStatus.CONFLICT,
                                    "Cette adresse e-mail est déjà utilisée par un autre utilisateur")))
                    .flatMap(savedUser -> saveMonitorEntity(schoolId, request, savedUser.getId()));
        } else {
            return saveMonitorEntity(schoolId, request, null);
        }
    }

    private Mono<MonitorDto> saveMonitorEntity(UUID schoolId, CreateMonitorRequest request, UUID userId) {
        Monitor monitor = Monitor.builder()
                .schoolId(schoolId)
                .userId(userId)
                .firstName(request.getFirstName() != null ? request.getFirstName().trim() : null)
                .lastName(request.getLastName() != null ? request.getLastName().trim() : null)
                .email(request.getEmail() != null ? request.getEmail().trim() : null)
                // Licence optionnelle : une valeur vide devient NULL (PostgreSQL
                // autorise plusieurs NULL sous une contrainte d'unicité), ce qui
                // permet de créer des moniteurs dont le permis n'est pas renseigné.
                .licenseNumber(blankToNull(request.getLicenseNumber()))
                .phoneNumber(request.getPhoneNumber() != null ? request.getPhoneNumber().trim() : null)
                .status(Monitor.MonitorStatus.ACTIVE)
                .createdAt(LocalDateTime.now())
                .build();

        return monitorRepository.save(monitor)
                .flatMap(this::enrichDtoWithEmail)
                // Doublon de numéro de permis : erreur métier claire (409) au lieu
                // d'une 500 brute remontant la contrainte SQL.
                .onErrorResume(org.springframework.dao.DuplicateKeyException.class, e -> Mono.error(
                        new ResponseStatusException(HttpStatus.CONFLICT,
                                "Ce numéro de permis est déjà attribué à un autre moniteur")));
    }

    private static String blankToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    public Flux<MonitorDto> getMonitorsBySchool(UUID schoolId) {
        return monitorRepository.findBySchoolId(schoolId).flatMap(this::enrichDtoWithEmail);
    }

    public Mono<MonitorDto> getMonitorById(UUID monitorId) {
        return monitorRepository.findById(monitorId).flatMap(this::enrichDtoWithEmail);
    }

    public Mono<MonitorDto> getMonitorByUserId(UUID userId) {
        return monitorRepository.findByUserId(userId)
                .flatMap(monitor -> schoolRepository.findById(monitor.getSchoolId())
                        .flatMap(school -> enrichDtoWithEmail(monitor).map(dto -> {
                            dto.setSchoolName(school.getName());
                            return dto;
                        }))
                        .switchIfEmpty(enrichDtoWithEmail(monitor)));
    }

    @Transactional
    public Mono<MonitorDto> updateMonitor(UUID schoolId, UUID monitorId, UpdateMonitorRequest request) {
        return monitorRepository.findById(monitorId)
                .filter(monitor -> schoolId.equals(monitor.getSchoolId()))
                .switchIfEmpty(Mono.error(new RuntimeException("Moniteur introuvable pour cette auto-ecole")))
                .flatMap(monitor -> {
                    if (request.getFirstName() != null)
                        monitor.setFirstName(request.getFirstName());
                    if (request.getLastName() != null)
                        monitor.setLastName(request.getLastName());
                    if (request.getLicenseNumber() != null)
                        monitor.setLicenseNumber(request.getLicenseNumber());
                    if (request.getPhoneNumber() != null)
                        monitor.setPhoneNumber(request.getPhoneNumber());
                    if (request.getStatus() != null)
                        monitor.setStatus(request.getStatus());
                    if (request.getEmail() != null)
                        monitor.setEmail(request.getEmail().trim());

                    Mono<Void> updateUserMono = Mono.empty();
                    if (monitor.getUserId() != null && (request.getEmail() != null || request.getPassword() != null)) {
                        updateUserMono = userRepository.findById(monitor.getUserId())
                                .flatMap(user -> {
                                    if (request.getEmail() != null && !request.getEmail().isBlank()) {
                                        user.setEmail(request.getEmail().trim().toLowerCase());
                                    }
                                    if (request.getPassword() != null && !request.getPassword().isBlank()) {
                                        user.setPassword(passwordEncoder.encode(request.getPassword().trim()));
                                    }
                                    return userRepository.save(user).then();
                                });
                    }

                    return updateUserMono
                            .then(monitorRepository.save(monitor))
                            .flatMap(this::enrichDtoWithEmail);
                });
    }

    @Transactional
    public Mono<Void> deleteMonitor(UUID schoolId, UUID monitorId) {
        return monitorRepository.findById(monitorId)
                .filter(monitor -> schoolId.equals(monitor.getSchoolId()))
                .switchIfEmpty(Mono.error(new RuntimeException("Moniteur introuvable pour cette auto-ecole")))
                .flatMap(monitor -> {
                    if (monitor.getUserId() != null) {
                        return userRepository.deleteById(monitor.getUserId())
                                .then(monitorRepository.delete(monitor));
                    }
                    return monitorRepository.delete(monitor);
                });
    }

    private Mono<MonitorDto> enrichDtoWithEmail(Monitor monitor) {
        MonitorDto dto = mapToDto(monitor);
        if (dto.getEmail() != null && !dto.getEmail().isBlank()) {
            return Mono.just(dto);
        }
        if (monitor.getUserId() != null) {
            return userRepository.findById(monitor.getUserId())
                    .map(user -> {
                        dto.setEmail(user.getEmail());
                        return dto;
                    })
                    .defaultIfEmpty(dto);
        }
        return Mono.just(dto);
    }

    private MonitorDto mapToDto(Monitor monitor) {
        return MonitorDto.builder()
                .id(monitor.getId())
                .schoolId(monitor.getSchoolId())
                .firstName(monitor.getFirstName())
                .lastName(monitor.getLastName())
                .email(monitor.getEmail())
                .licenseNumber(monitor.getLicenseNumber())
                .phoneNumber(monitor.getPhoneNumber())
                .userId(monitor.getUserId())
                .status(monitor.getStatus())
                .build();
    }
}
