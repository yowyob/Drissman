package com.drissman.service;

import com.drissman.api.dto.ChangePasswordRequest;
import com.drissman.api.dto.UpdateProfileRequest;
import com.drissman.api.dto.UserDto;
import com.drissman.domain.entity.User;
import com.drissman.domain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public Mono<UserDto> findById(UUID id) {
        return userRepository.findById(id)
                .map(this::toDto);
    }

    public Mono<UserDto> findByEmail(String email) {
        return userRepository.findByEmail(email)
                .map(this::toDto);
    }

    public Mono<UserDto> updateProfile(UUID userId, UpdateProfileRequest request) {
        return userRepository.findById(userId)
                .flatMap(user -> {
                    if (request.getFirstName() != null) {
                        user.setFirstName(request.getFirstName());
                    }
                    if (request.getLastName() != null) {
                        user.setLastName(request.getLastName());
                    }
                    if (request.getEmail() != null) {
                        user.setEmail(request.getEmail());
                    }
                    return userRepository.save(user);
                })
                .map(this::toDto);
    }

    public Mono<Void> changePassword(UUID userId, ChangePasswordRequest request) {
        return userRepository.findById(userId)
                .flatMap(user -> {
                    if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
                        return Mono.error(new IllegalArgumentException("Mot de passe actuel incorrect"));
                    }
                    user.setPassword(passwordEncoder.encode(request.getNewPassword()));
                    return userRepository.save(user);
                })
                .then();
    }

    private UserDto toDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole() != null ? user.getRole().name() : null)
                .schoolId(user.getSchoolId())
                .build();
    }
}
