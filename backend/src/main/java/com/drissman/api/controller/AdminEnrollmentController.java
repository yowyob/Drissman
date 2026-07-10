package com.drissman.api.controller;

import com.drissman.api.dto.EnrollmentViewDto;
import com.drissman.api.dto.InvoiceViewDto;
import com.drissman.api.dto.PaymentDto;
import com.drissman.api.dto.UpdateEnrollmentStatusRequest;
import com.drissman.domain.entity.User;
import com.drissman.domain.repository.UserRepository;
import com.drissman.service.EnrollmentAppService;
import com.drissman.service.InvoiceQueryService;
import com.drissman.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.security.Principal;
import java.util.UUID;

@RestController
@RequestMapping("/api/schools/admin")
@RequiredArgsConstructor
public class AdminEnrollmentController {

    private final EnrollmentAppService enrollmentAppService;
    private final InvoiceQueryService invoiceQueryService;
    private final PaymentService paymentService;
    private final UserRepository userRepository;

    @GetMapping("/enrollments")
    public Flux<EnrollmentViewDto> getSchoolEnrollments(Principal principal) {
        return getSchoolId(principal)
                .flatMapMany(enrollmentAppService::getEnrollmentsForSchool);
    }

    @PatchMapping("/enrollments/{id}/status")
    public Mono<EnrollmentViewDto> updateEnrollmentStatus(
            Principal principal,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateEnrollmentStatusRequest request) {
        return getSchoolId(principal)
                .flatMap(schoolId -> enrollmentAppService.updateEnrollmentStatus(schoolId, id, request.getStatus()));
    }

    @GetMapping("/invoices")
    public Flux<InvoiceViewDto> getSchoolInvoices(Principal principal) {
        return getSchoolId(principal)
                .flatMapMany(invoiceQueryService::getInvoicesForSchool);
    }

    /** Paiements réels reçus par l'école (source de vérité, vue Finances). */
    @GetMapping("/payments")
    public Flux<PaymentDto> getSchoolPayments(Principal principal) {
        return getSchoolId(principal)
                .flatMapMany(paymentService::getPaymentsForSchool);
    }

    /** Confirme la réception d'un paiement : facture PAID + inscription ACTIVE. */
    @PostMapping("/payments/{invoiceId}/confirm")
    public Mono<PaymentDto> confirmPayment(Principal principal, @PathVariable UUID invoiceId) {
        return getSchoolId(principal)
                .flatMap(schoolId -> paymentService.confirm(schoolId, invoiceId));
    }

    private Mono<UUID> getSchoolId(Principal principal) {
        if (principal == null) {
            return Mono.error(new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentification requise"));
        }

        return userRepository.findById(UUID.fromString(principal.getName()))
                .map(User::getSchoolId)
                .filter(schoolId -> schoolId != null)
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.FORBIDDEN, "Compte non associe a une ecole")));
    }
}
