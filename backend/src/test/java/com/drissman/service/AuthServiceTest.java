package com.drissman.service;

import com.drissman.api.dto.AuthResponse;
import com.drissman.api.dto.RegisterRequest;
import com.drissman.domain.entity.User;
import com.drissman.domain.repository.SchoolRepository;
import com.drissman.domain.repository.UserRepository;
import com.drissman.kernel.KernelAuthService;
import com.drissman.security.JwtTokenProvider;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

        @Mock
        private UserRepository userRepository;

        @Mock
        private SchoolRepository schoolRepository;

        @Mock
        private PasswordEncoder passwordEncoder;

        @Mock
        private JwtTokenProvider jwtTokenProvider;

        @Mock
        private KernelAuthService kernelAuthService;

        @InjectMocks
        private AuthService authService;

        @Test
        void registerCandidat_shouldSucceed() {
                RegisterRequest request = new RegisterRequest();
                request.setEmail("candidat@example.com");
                request.setPassword("password123");
                request.setFirstName("John");
                request.setLastName("Visitor");
                request.setRole("candidat"); // Lowercase as sent by frontend

                when(userRepository.existsByEmail(request.getEmail())).thenReturn(Mono.just(false));
                when(passwordEncoder.encode(request.getPassword())).thenReturn("encodedPassword");

                User savedUser = User.builder()
                                .id(UUID.randomUUID())
                                .email(request.getEmail())
                                .firstName(request.getFirstName())
                                .lastName(request.getLastName())
                                .role(User.Role.CANDIDAT)
                                .build();

                when(userRepository.save(any(User.class))).thenReturn(Mono.just(savedUser));
                when(jwtTokenProvider.generateToken(any(), any(), any(), any())).thenReturn("mockToken");

                Mono<AuthResponse> result = authService.register(request);

                StepVerifier.create(result)
                                .expectNextMatches(response -> response.getToken().equals("mockToken") &&
                                                response.getUser().getRole().equals("CANDIDAT"))
                                .verifyComplete();
        }
}
