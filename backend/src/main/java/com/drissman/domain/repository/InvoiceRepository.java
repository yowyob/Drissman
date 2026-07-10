package com.drissman.domain.repository;

import com.drissman.domain.entity.Invoice;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

public interface InvoiceRepository extends ReactiveCrudRepository<Invoice, UUID> {
    Flux<Invoice> findByUserId(UUID userId);

    Mono<Invoice> findByProviderReference(String providerReference);

    Flux<Invoice> findByEnrollmentId(UUID enrollmentId);

    Flux<Invoice> findBySchoolId(UUID schoolId);

    @Query("SELECT * FROM invoices ORDER BY created_at DESC LIMIT 10")
    Flux<Invoice> findRecentInvoices();
}
