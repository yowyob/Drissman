package com.drissman.service;

import com.drissman.api.dto.AuthResponse;
import com.drissman.api.dto.LoginRequest;
import com.drissman.api.dto.RegisterRequest;
import com.drissman.api.dto.UpgradeVisitorRoleRequest;
import com.drissman.domain.entity.School;
import com.drissman.domain.entity.User;
import com.drissman.domain.repository.SchoolRepository;
import com.drissman.domain.repository.UserRepository;
import com.drissman.kernel.KernelAuthService;
import com.drissman.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final SchoolRepository schoolRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final KernelAuthService kernelAuthService;

    @org.springframework.beans.factory.annotation.Value("${app.superadmin.secret:DRISSMAN_SUPER_SECRET}")
    private String superAdminSecret;

    public Mono<AuthResponse> register(RegisterRequest request) {
        return userRepository.existsByEmail(request.getEmail())
                .flatMap(exists -> {
                    if (exists) {
                        return Mono.error(new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email already exists"));
                    }

                    User.Role roleTemp;
                    try {
                        roleTemp = User.Role.valueOf(request.getRole().toUpperCase());
                    } catch (IllegalArgumentException | NullPointerException e) {
                        roleTemp = User.Role.VISITOR; // Fallback to VISITOR if role is invalid or not yet in enum
                    }
                    final User.Role userRole = roleTemp;

                    if (userRole == User.Role.SUPER_ADMIN) {
                        if (request.getSecretCode() == null || !request.getSecretCode().equals(superAdminSecret)) {
                            return Mono.error(new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Code secret Super Admin invalide"));
                        }
                        
                        User user = User.builder()
                                .email(request.getEmail())
                                .password(passwordEncoder.encode(request.getPassword()))
                                .firstName(request.getFirstName())
                                .lastName(request.getLastName())
                                .phone(request.getPhone())
                                .role(userRole)
                                .build();

                        return userRepository.save(user)
                                .map(this::authenticated);
                    }

                    if (userRole == User.Role.SCHOOL_ADMIN) {
                        School school = School.builder()
                                .name(request.getSchoolName() != null ? request.getSchoolName()
                                        : "Ma Nouvelle Auto-Ecole")
                                .address("Adresse a completer")
                                .city("Yaounde") // Default city
                                .build();

                        return schoolRepository.save(school)
                                .flatMap(savedSchool -> {
                                    User user = User.builder()
                                            .email(request.getEmail())
                                            .password(passwordEncoder.encode(request.getPassword()))
                                            .firstName(request.getFirstName())
                                            .lastName(request.getLastName())
                                            .phone(request.getPhone())
                                            .role(userRole)
                                            .schoolId(savedSchool.getId())
                                            .build();
                                    return userRepository.save(user);
                                })
                                .map(this::authenticated);
                    } else {
                        // VISITOR/CANDIDAT/MONITOR: simple user creation without school
                        User user = User.builder()
                                .email(request.getEmail())
                                .password(passwordEncoder.encode(request.getPassword()))
                                .firstName(request.getFirstName())
                                .lastName(request.getLastName())
                                .phone(request.getPhone())
                                .role(userRole)
                                .build();

                        return userRepository.save(user)
                                .map(this::authenticated);
                    }
                });
    }

    public Mono<AuthResponse> upgradeVisitorRole(java.util.UUID userId, UpgradeVisitorRoleRequest request) {
        return userRepository.findById(userId)
                .switchIfEmpty(Mono.error(new RuntimeException("Utilisateur non trouvé")))
                .flatMap(user -> {
                    if (user.getRole() != User.Role.VISITOR) {
                        return Mono.error(new RuntimeException("Seul un compte visiteur peut changer de rôle"));
                    }

                    User.Role targetRole;
                    try {
                        targetRole = User.Role.valueOf(request.getTargetRole().toUpperCase());
                    } catch (IllegalArgumentException | NullPointerException e) {
                        return Mono.error(new RuntimeException("Rôle cible invalide"));
                    }

                    if (targetRole != User.Role.CANDIDAT && targetRole != User.Role.SCHOOL_ADMIN) {
                        return Mono.error(new RuntimeException("Le compte visiteur peut devenir CANDIDAT ou SCHOOL_ADMIN"));
                    }

                    if (targetRole == User.Role.CANDIDAT) {
                        user.setRole(User.Role.CANDIDAT);
                        user.setSchoolId(null);
                        return userRepository.save(user).map(this::authenticated);
                    }

                    School school = School.builder()
                            .name(request.getSchoolName() != null && !request.getSchoolName().isBlank()
                                    ? request.getSchoolName()
                                    : "Ma Nouvelle Auto-Ecole")
                            .address("Adresse a completer")
                            .city("Yaounde")
                            .build();

                    return schoolRepository.save(school)
                            .flatMap(savedSchool -> {
                                user.setRole(User.Role.SCHOOL_ADMIN);
                                user.setSchoolId(savedSchool.getId());
                                return userRepository.save(user);
                            })
                            .map(this::authenticated);
                });
    }

    public Mono<AuthResponse> login(LoginRequest request) {
        String normalizedEmail = request.getEmail() != null ? request.getEmail().trim().toLowerCase() : "";
        String rawPassword = request.getPassword() != null ? request.getPassword() : "";
        String trimmedPassword = rawPassword.trim();

        return userRepository.findFirstByEmailIgnoreCase(normalizedEmail)
                .switchIfEmpty(Mono.error(new RuntimeException("Invalid credentials")))
                .flatMap(user -> {
                    String storedPassword = user.getPassword() != null ? user.getPassword() : "";

                    boolean matchesRaw = !rawPassword.isEmpty() && passwordEncoder.matches(rawPassword, storedPassword);
                    boolean matchesTrimmed = !trimmedPassword.isEmpty()
                            && !trimmedPassword.equals(rawPassword)
                            && passwordEncoder.matches(trimmedPassword, storedPassword);

                    if (matchesRaw || matchesTrimmed) {
                        return Mono.just(authenticated(user));
                    }

                    // Backward compatibility for legacy rows stored in plain text.
                    if (!rawPassword.isEmpty() && rawPassword.equals(storedPassword)) {
                        user.setPassword(passwordEncoder.encode(rawPassword));
                        return userRepository.save(user).map(this::authenticated);
                    }
                    if (!trimmedPassword.isEmpty() && trimmedPassword.equals(storedPassword)) {
                        user.setPassword(passwordEncoder.encode(trimmedPassword));
                        return userRepository.save(user).map(this::authenticated);
                    }

                    return Mono.error(new RuntimeException("Invalid credentials"));
                });
    }

    /**
     * Réponse d'authentification + synchronisation kernel en arrière-plan
     * (compte-miroir + token 15 min). Best-effort : ne bloque jamais le login.
     */
    private AuthResponse authenticated(User user) {
        kernelAuthService.syncUserInBackground(user);
        return createAuthResponse(user);
    }

    private AuthResponse createAuthResponse(User user) {
        String token = jwtTokenProvider.generateToken(
                user.getId(),
                user.getEmail(),
                user.getRole().name(),
                user.getSchoolId());

        return AuthResponse.builder()
                .user(AuthResponse.UserDto.builder()
                        .id(user.getId())
                        .email(user.getEmail())
                        .firstName(user.getFirstName())
                        .lastName(user.getLastName())
                        .role(user.getRole().name())
                        .schoolId(user.getSchoolId())
                        .build())
                .token(token)
                .build();
    }
}

