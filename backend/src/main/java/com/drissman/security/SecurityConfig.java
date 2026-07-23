package com.drissman.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

import lombok.RequiredArgsConstructor;
import org.springframework.security.config.web.server.SecurityWebFiltersOrder;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebFluxSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    /** Origines CORS autorisées, séparées par des virgules (surchargées en prod). */
    @org.springframework.beans.factory.annotation.Value(
            "${app.cors.allowed-origins:https://drissman0.vercel.app,http://localhost:3000}")
    private String allowedOrigins;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * CorsWebFilter runs BEFORE Spring Security (highest precedence).
     * This ensures preflight OPTIONS requests always get proper CORS headers,
     * regardless of authentication rules.
     */
    @Bean
    @Order(Ordered.HIGHEST_PRECEDENCE)
    public CorsWebFilter corsWebFilter() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(Arrays.asList(allowedOrigins.split("\\s*,\\s*")));
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"));
        config.setAllowedHeaders(Arrays.asList("*"));
        config.setExposedHeaders(Arrays.asList("*"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);

        return new CorsWebFilter(source);
    }

    @Bean
    public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
        return http
                // Disable Spring Security's built-in CORS — we handle it via CorsWebFilter
                // above
                .cors(ServerHttpSecurity.CorsSpec::disable)
                .csrf(ServerHttpSecurity.CsrfSpec::disable)
                .addFilterAt(jwtAuthenticationFilter, SecurityWebFiltersOrder.AUTHENTICATION)
                .authorizeExchange(auth -> auth
                        // Allow all preflight requests
                        .pathMatchers(HttpMethod.OPTIONS).permitAll()

                        // ⚠️ ORDRE CRITIQUE : en WebFlux, la PREMIÈRE règle qui
                        // correspond gagne. Les espaces réservés à un rôle doivent
                        // donc précéder les règles publiques plus larges.
                        // Sans cette ligne AVANT `GET /api/schools/**`, tous les GET
                        // de l'espace gérant (factures, paiements, inscriptions,
                        // élèves, véhicules, documents…) échappaient au contrôle de
                        // rôle et n'étaient protégés que par le code des contrôleurs.
                        .pathMatchers("/api/schools/admin/**").hasRole("SCHOOL_ADMIN")

                        // Public endpoints — no auth required
                        .pathMatchers("/api/auth/**").permitAll()
                        .pathMatchers("/api/health/**", "/api/health").permitAll()
                        .pathMatchers("/actuator/health").permitAll()
                        .pathMatchers(HttpMethod.GET, "/api/schools/**").permitAll()
                        .pathMatchers(HttpMethod.GET, "/api/reviews/**").permitAll()
                        .pathMatchers(HttpMethod.GET, "/api/offers/**").permitAll()
                        .pathMatchers(HttpMethod.GET, "/api/images/**").permitAll()
                        .pathMatchers(HttpMethod.GET, "/api/training-periods/published/**").permitAll()

                        // Véhicules (P5) : lecture + flux SSE publics (carte),
                        // mise à jour de position réservée aux moniteurs/écoles
                        .pathMatchers(HttpMethod.GET, "/api/vehicles/school/**").permitAll()
                        .pathMatchers(HttpMethod.POST, "/api/vehicles/*/position")
                        .hasAnyRole("MONITOR", "SCHOOL_ADMIN")

                        // Callback prestataire de paiement (Stripe via Yowyob) : non authentifié
                        .pathMatchers(HttpMethod.POST, "/api/payments/webhook").permitAll()

                        // Role-scoped areas
                        .pathMatchers("/api/kernel/admin/**").hasAnyRole("SCHOOL_ADMIN", "SUPER_ADMIN")
                        .pathMatchers("/api/superadmin/**").hasRole("SUPER_ADMIN")
                        // NB : /api/schools/admin/** est déclaré plus haut (avant la
                        // règle publique GET /api/schools/**) — ne pas le redéclarer ici.
                        .pathMatchers("/api/monitors/**").hasAnyRole("MONITOR", "SCHOOL_ADMIN")
                        .pathMatchers("/api/enrollments/**").hasAnyRole("VISITOR", "CANDIDAT", "SCHOOL_ADMIN")

                        // All other endpoints require authentication
                        .anyExchange().authenticated())
                .build();
    }
}
