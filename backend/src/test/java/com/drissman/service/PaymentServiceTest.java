package com.drissman.service;

import com.drissman.api.dto.InitiatePaymentRequest;
import com.drissman.domain.entity.Enrollment;
import com.drissman.domain.entity.Invoice;
import com.drissman.domain.entity.Offer;
import com.drissman.domain.repository.EnrollmentRepository;
import com.drissman.domain.repository.InvoiceRepository;
import com.drissman.domain.repository.OfferRepository;
import com.drissman.domain.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

        @Mock
        private InvoiceRepository invoiceRepository;

        @Mock
        private EnrollmentRepository enrollmentRepository;

        @Mock
        private OfferRepository offerRepository;

        @Mock
        private UserRepository userRepository;

        @Mock
        private com.drissman.kernel.KernelPaymentGatewayClient kernelPaymentGatewayClient;

        @Mock
        private com.drissman.kernel.KernelAccountingService kernelAccountingService;

        @InjectMocks
        private PaymentService paymentService;

        private UUID userId;
        private UUID schoolId;
        private UUID enrollmentId;
        private UUID offerId;
        private Enrollment enrollment;

        @BeforeEach
        void setUp() {
                userId = UUID.randomUUID();
                schoolId = UUID.randomUUID();
                enrollmentId = UUID.randomUUID();
                offerId = UUID.randomUUID();
                enrollment = Enrollment.builder()
                                .id(enrollmentId)
                                .userId(userId)
                                .schoolId(schoolId)
                                .offerId(offerId)
                                .status(Enrollment.EnrollmentStatus.PENDING)
                                .build();
        }

        private InitiatePaymentRequest request(String method, String phone) {
                return InitiatePaymentRequest.builder()
                                .enrollmentId(enrollmentId)
                                .method(method)
                                .phone(phone)
                                .build();
        }

        @Test
        void initiate_shouldCreatePendingInvoice_withMethodAndPhone() {
                when(enrollmentRepository.findById(enrollmentId)).thenReturn(Mono.just(enrollment));
                when(invoiceRepository.findByEnrollmentId(enrollmentId)).thenReturn(Flux.empty());
                when(offerRepository.findById(offerId))
                                .thenReturn(Mono.just(Offer.builder().id(offerId).price(250000).build()));
                when(invoiceRepository.save(any(Invoice.class)))
                                .thenAnswer(inv -> Mono.just(inv.getArgument(0, Invoice.class)));
                when(kernelPaymentGatewayClient.initiatePayment(any(String.class), anyLong(), any(String.class), any(String.class), any(String.class), any(String.class)))
                                .thenReturn(Mono.just(com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode()
                                        .put("id", "tx-123")
                                        .put("redirectUrl", "http://test.com")));

                StepVerifier.create(paymentService.initiate(userId, request("ORANGE_MONEY", "+237691234567")))
                                .assertNext(dto -> {
                                        org.junit.jupiter.api.Assertions.assertEquals("PENDING", dto.getStatus());
                                        org.junit.jupiter.api.Assertions.assertEquals("ORANGE_MONEY", dto.getMethod());
                                        org.junit.jupiter.api.Assertions.assertEquals("+237691234567", dto.getPhone());
                                        org.junit.jupiter.api.Assertions.assertEquals(250000, dto.getAmount());
                                        org.junit.jupiter.api.Assertions.assertTrue(dto.getReference().startsWith("DRIS-"));
                                })
                                .verifyComplete();
        }

        @Test
        void initiate_shouldRejectInvalidMethod() {
                StepVerifier.create(paymentService.initiate(userId, request("BITCOIN", null)))
                                .expectErrorMatches(e -> e instanceof ResponseStatusException
                                                && ((ResponseStatusException) e).getStatusCode().value() == 400)
                                .verify();
        }

        @Test
        void initiate_shouldRequirePhoneForMobileMoney() {
                StepVerifier.create(paymentService.initiate(userId, request("MTN_MOMO", "  ")))
                                .expectErrorMatches(e -> e instanceof ResponseStatusException
                                                && ((ResponseStatusException) e).getStatusCode().value() == 400)
                                .verify();
        }

        @Test
        void initiate_shouldRejectForeignEnrollment() {
                when(enrollmentRepository.findById(enrollmentId)).thenReturn(Mono.just(enrollment));

                StepVerifier.create(paymentService.initiate(UUID.randomUUID(), request("CASH", null)))
                                .expectErrorMatches(e -> e instanceof ResponseStatusException
                                                && ((ResponseStatusException) e).getStatusCode().value() == 403)
                                .verify();
        }

        @Test
        void initiate_shouldRejectDuplicatePayment() {
                when(enrollmentRepository.findById(enrollmentId)).thenReturn(Mono.just(enrollment));
                when(invoiceRepository.findByEnrollmentId(enrollmentId)).thenReturn(Flux.just(
                                Invoice.builder().status(Invoice.InvoiceStatus.PENDING).build()));

                StepVerifier.create(paymentService.initiate(userId, request("CASH", null)))
                                .expectErrorMatches(e -> e instanceof ResponseStatusException
                                                && ((ResponseStatusException) e).getStatusCode().value() == 409)
                                .verify();
        }

        @Test
        void confirm_shouldMarkPaidAndActivateEnrollment() {
                UUID invoiceId = UUID.randomUUID();
                Invoice invoice = Invoice.builder()
                                .id(invoiceId)
                                .enrollmentId(enrollmentId)
                                .schoolId(schoolId)
                                .amount(250000)
                                .status(Invoice.InvoiceStatus.PENDING)
                                .createdAt(LocalDateTime.now())
                                .build();

                when(invoiceRepository.findById(invoiceId)).thenReturn(Mono.just(invoice));
                when(invoiceRepository.save(any(Invoice.class)))
                                .thenAnswer(inv -> Mono.just(inv.getArgument(0, Invoice.class)));
                when(enrollmentRepository.findById(enrollmentId)).thenReturn(Mono.just(enrollment));
                when(enrollmentRepository.save(any(Enrollment.class)))
                                .thenAnswer(inv -> Mono.just(inv.getArgument(0, Enrollment.class)));

                StepVerifier.create(paymentService.confirm(schoolId, invoiceId))
                                .assertNext(dto -> {
                                        org.junit.jupiter.api.Assertions.assertEquals("PAID", dto.getStatus());
                                        org.junit.jupiter.api.Assertions.assertNotNull(dto.getPaidAt());
                                })
                                .verifyComplete();

                org.junit.jupiter.api.Assertions.assertEquals(Enrollment.EnrollmentStatus.ACTIVE,
                                enrollment.getStatus());
        }

        @Test
        void confirm_shouldRejectInvoiceOfAnotherSchool() {
                UUID invoiceId = UUID.randomUUID();
                when(invoiceRepository.findById(invoiceId)).thenReturn(Mono.just(
                                Invoice.builder().id(invoiceId).schoolId(UUID.randomUUID())
                                                .status(Invoice.InvoiceStatus.PENDING).build()));

                StepVerifier.create(paymentService.confirm(schoolId, invoiceId))
                                .expectErrorMatches(e -> e instanceof ResponseStatusException
                                                && ((ResponseStatusException) e).getStatusCode().value() == 403)
                                .verify();

                verify(invoiceRepository, never()).save(any());
        }

        @Test
        void onEnrollmentStatusChanged_shouldFailPendingInvoicesWhenCancelled() {
                Invoice pending = Invoice.builder()
                                .id(UUID.randomUUID())
                                .enrollmentId(enrollmentId)
                                .status(Invoice.InvoiceStatus.PENDING)
                                .build();
                when(invoiceRepository.findByEnrollmentId(enrollmentId)).thenReturn(Flux.just(pending));
                when(invoiceRepository.save(any(Invoice.class)))
                                .thenAnswer(inv -> Mono.just(inv.getArgument(0, Invoice.class)));

                StepVerifier.create(paymentService.onEnrollmentStatusChanged(enrollmentId,
                                Enrollment.EnrollmentStatus.CANCELLED))
                                .verifyComplete();

                org.junit.jupiter.api.Assertions.assertEquals(Invoice.InvoiceStatus.FAILED, pending.getStatus());
        }
}
