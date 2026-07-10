package com.drissman.service;

import com.drissman.api.dto.InvoiceViewDto;
import com.drissman.domain.entity.Enrollment;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Comparator;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class InvoiceQueryService {

    private final EnrollmentAppService enrollmentAppService;

    public Flux<InvoiceViewDto> getInvoicesForSchool(java.util.UUID schoolId) {
        LocalDateTime now = LocalDateTime.now();
        return enrollmentAppService.getEnrollmentsForSchool(schoolId)
                .filter(e -> !"CANCELLED".equals(e.getStatus()))
                .index()
                .map(indexed -> {
                    long idx = indexed.getT1() + 1;
                    var e = indexed.getT2();

                    LocalDateTime dueDate = e.getEnrolledAt().plusDays(7);
                    String status = mapInvoiceStatus(e.getStatus(), dueDate, now);

                    return InvoiceViewDto.builder()
                            .id(e.getId())
                            .enrollmentId(e.getId())
                            .invoiceNumber(String.format(Locale.ROOT, "INV-%d-%04d", e.getEnrolledAt().getYear(), idx))
                            .studentName(e.getStudentName())
                            .offer(e.getOfferName())
                            .amount(e.getPrice() != null ? e.getPrice() : 0)
                            .status(status)
                            .dueDate(dueDate)
                            .paidAt("PAID".equals(status) ? e.getEnrolledAt() : null)
                            .build();
                })
                .sort(Comparator.comparing((InvoiceViewDto i) -> i.getDueDate().toEpochSecond(ZoneOffset.UTC)).reversed());
    }

    private String mapInvoiceStatus(String enrollmentStatus, LocalDateTime dueDate, LocalDateTime now) {
        Enrollment.EnrollmentStatus status = Enrollment.EnrollmentStatus.valueOf(enrollmentStatus);
        if (status == Enrollment.EnrollmentStatus.ACTIVE || status == Enrollment.EnrollmentStatus.COMPLETED) {
            return "PAID";
        }
        if (dueDate.isBefore(now)) {
            return "OVERDUE";
        }
        return "PENDING";
    }
}
