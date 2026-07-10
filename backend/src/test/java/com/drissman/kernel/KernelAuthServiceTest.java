package com.drissman.kernel;

import com.drissman.domain.entity.User;
import com.drissman.domain.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class KernelAuthServiceTest {

        @Mock
        private KernelClient kernelClient;

        @Mock
        private KernelTokenStore tokenStore;

        @Mock
        private UserRepository userRepository;

        @InjectMocks
        private KernelAuthService kernelAuthService;

        private static final ObjectMapper MAPPER = new ObjectMapper();

        private User user;

        @BeforeEach
        void setUp() {
                ReflectionTestUtils.setField(kernelAuthService, "derivationSecret", "test-secret-for-derivation");
                ReflectionTestUtils.setField(kernelAuthService, "tenantId",
                                "11111111-1111-1111-1111-111111111111");
                user = User.builder()
                                .id(UUID.fromString("dddce4a1-5436-45ee-b454-628cd2b0b289"))
                                .email("test@drissman.cm")
                                .firstName("Test")
                                .lastName("User")
                                .build();
        }

        private KernelResponse response(String json) throws Exception {
                KernelResponse r = new KernelResponse();
                r.setSuccess(true);
                r.setData(MAPPER.readTree(json));
                return r;
        }

        // ----- Mot de passe dérivé -----

        @Test
        void derivedPassword_shouldBeDeterministic() {
                UUID id = UUID.randomUUID();
                assertEquals(kernelAuthService.derivedPassword(id), kernelAuthService.derivedPassword(id));
        }

        @Test
        void derivedPassword_shouldMeetKernelPolicy() {
                String pwd = kernelAuthService.derivedPassword(UUID.randomUUID());
                assertTrue(pwd.length() >= 10, "au moins 10 caractères");
                assertTrue(pwd.matches(".*[A-Z].*"), "au moins une majuscule");
                assertTrue(pwd.matches(".*[a-z].*"), "au moins une minuscule");
                assertTrue(pwd.matches(".*[0-9].*"), "au moins un chiffre");
                assertTrue(pwd.matches(".*[^A-Za-z0-9].*"), "au moins un symbole");
        }

        @Test
        void derivedPassword_shouldDifferPerUser() {
                assertTrue(!kernelAuthService.derivedPassword(UUID.randomUUID())
                                .equals(kernelAuthService.derivedPassword(UUID.randomUUID())));
        }

        // ----- Synchronisation login-first -----

        @Test
        void syncUser_shouldStoreTokenAndKernelId_whenLoginSucceeds() throws Exception {
                String kernelId = UUID.randomUUID().toString();
                when(kernelClient.post(eq("/api/auth/login"), any()))
                                .thenReturn(Mono.just(response(
                                                "{\"accessToken\":\"jwt-token\",\"expiresInSeconds\":900,\"id\":\""
                                                                + kernelId + "\"}")));
                when(userRepository.save(any(User.class)))
                                .thenAnswer(inv -> Mono.just(inv.getArgument(0, User.class)));

                StepVerifier.create(kernelAuthService.syncUser(user)).verifyComplete();

                verify(tokenStore).put(eq(user.getId()), eq("jwt-token"), eq(900L));
                assertEquals(UUID.fromString(kernelId), user.getKernelUserId());
        }

        @Test
        void syncUser_shouldSignUp_whenLoginFails() throws Exception {
                when(kernelClient.post(eq("/api/auth/login"), any()))
                                .thenReturn(Mono.error(new RuntimeException("401 Unauthorized")));
                when(kernelClient.post(eq("/api/auth/sign-up"), any()))
                                .thenReturn(Mono.just(response(
                                                "{\"email\":\"test@drissman.cm\",\"status\":\"EMAIL_VERIFICATION_REQUIRED\"}")));

                StepVerifier.create(kernelAuthService.syncUser(user)).verifyComplete();

                // Compte créé mais en attente de vérification : pas de token, pas d'id.
                verify(tokenStore, never()).put(any(), anyString(), org.mockito.ArgumentMatchers.anyLong());
                verify(userRepository, never()).save(any());
        }

        @Test
        void syncUser_shouldNotFail_whenKernelIsDown() {
                when(kernelClient.post(eq("/api/auth/login"), any()))
                                .thenReturn(Mono.error(new RuntimeException("connexion refusée")));
                when(kernelClient.post(eq("/api/auth/sign-up"), any()))
                                .thenReturn(Mono.error(new RuntimeException("connexion refusée")));

                // Best-effort : l'erreur remonte au subscriber (loguée), sans effet de bord.
                StepVerifier.create(kernelAuthService.syncUser(user))
                                .expectError()
                                .verify();

                verify(tokenStore, never()).put(any(), anyString(), org.mockito.ArgumentMatchers.anyLong());
        }
}
