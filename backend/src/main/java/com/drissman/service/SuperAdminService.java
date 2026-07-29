package com.drissman.service;

import com.drissman.api.dto.GlobalStatsDto;
import com.drissman.domain.entity.School;
import com.drissman.domain.entity.User;
import com.drissman.domain.entity.Enrollment;
import com.drissman.domain.entity.Invoice;
import com.drissman.domain.entity.Offer;
import com.drissman.domain.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SuperAdminService {

    private final SchoolRepository schoolRepository;
    private final UserRepository userRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final InvoiceRepository invoiceRepository;
    private final OfferRepository offerRepository;

    public Flux<School> getPendingSchools() {
        return schoolRepository.findAll()
                .filter(school -> Boolean.FALSE.equals(school.getIsVerified()));
    }

    public Mono<School> validateSchool(UUID schoolId) {
        return schoolRepository.validateSchool(schoolId)
                .then(schoolRepository.findById(schoolId))
                .switchIfEmpty(Mono.error(new RuntimeException("Auto-école non trouvée")));
    }

    public Mono<GlobalStatsDto> getGlobalStats() {
        Mono<Long> totalUsersMono = userRepository.count();
        Mono<Long> totalSchoolsMono = schoolRepository.count();
        Mono<Long> pendingSchoolsMono = schoolRepository.findAll()
                .filter(school -> Boolean.FALSE.equals(school.getIsVerified()))
                .count();
        Mono<Long> totalEnrollmentsMono = enrollmentRepository.count();
        Mono<Long> totalRevenueMono = invoiceRepository.findAll()
                .filter(inv -> inv.getStatus() == Invoice.InvoiceStatus.PAID)
                .map(inv -> (long) inv.getAmount())
                .reduce(0L, Long::sum);

        Mono<Map<String, Long>> usersByRoleMono = userRepository.findAll()
                .filter(user -> user.getRole() != null)
                .groupBy(user -> user.getRole().name())
                .flatMap(group -> group.count().map(count -> Map.entry(group.key(), count)))
                .collectMap(Map.Entry::getKey, Map.Entry::getValue);

        Mono<Map<String, Long>> enrollmentsByStatusMono = enrollmentRepository.findAll()
                .filter(enrollment -> enrollment.getStatus() != null)
                .groupBy(enrollment -> enrollment.getStatus().name())
                .flatMap(group -> group.count().map(count -> Map.entry(group.key(), count)))
                .collectMap(Map.Entry::getKey, Map.Entry::getValue);

        DateTimeFormatter monthFormatter = DateTimeFormatter.ofPattern("yyyy-MM");

        Mono<List<GlobalStatsDto.MonthlyRevenue>> revenueByMonthMono = invoiceRepository.findAll()
                .filter(inv -> inv.getStatus() == Invoice.InvoiceStatus.PAID && inv.getPaidAt() != null)
                .groupBy(inv -> inv.getPaidAt().format(monthFormatter))
                .flatMap(group -> group.map(inv -> (long) inv.getAmount())
                        .reduce(0L, Long::sum)
                        .map(sum -> GlobalStatsDto.MonthlyRevenue.builder()
                                .month(group.key())
                                .revenue(sum)
                                .build()))
                .collectSortedList(Comparator.comparing(GlobalStatsDto.MonthlyRevenue::getMonth));

        Mono<List<GlobalStatsDto.SchoolRegistrationTrend>> schoolsTrendMono = schoolRepository.findAll()
                .filter(school -> school.getCreatedAt() != null)
                .groupBy(school -> school.getCreatedAt().format(monthFormatter))
                .flatMap(group -> group.count()
                        .map(count -> GlobalStatsDto.SchoolRegistrationTrend.builder()
                                .month(group.key())
                                .count(count)
                                .build()))
                .collectSortedList(Comparator.comparing(GlobalStatsDto.SchoolRegistrationTrend::getMonth));

        Flux<GlobalStatsDto.RecentActivityDto> recentSchoolActivities = schoolRepository.findRecentSchools()
                .map(school -> GlobalStatsDto.RecentActivityDto.builder()
                        .type("SCHOOL")
                        .description("Nouvelle auto-école '" + school.getName() + "' inscrite à " + school.getCity())
                        .timestamp(school.getCreatedAt() != null ? school.getCreatedAt().toString() : LocalDateTime.now().toString())
                        .status(Boolean.TRUE.equals(school.getIsVerified()) ? "VERIFIED" : "PENDING")
                        .schoolName(school.getName())
                        .resourceId(school.getId().toString())
                        .build());

        Flux<GlobalStatsDto.RecentActivityDto> recentInvoiceActivities = invoiceRepository.findRecentInvoices()
                .flatMap(invoice -> userRepository.findById(invoice.getUserId())
                        .map(user -> user.getFirstName() + " " + user.getLastName())
                        .defaultIfEmpty("Utilisateur inconnu")
                        .flatMap(userName -> {
                            if (invoice.getSchoolId() != null) {
                                return schoolRepository.findById(invoice.getSchoolId())
                                        .map(School::getName)
                                        .defaultIfEmpty("Auto-école inconnue")
                                        .map(schoolName -> GlobalStatsDto.RecentActivityDto.builder()
                                                .type("INVOICE")
                                                .description("Paiement de " + invoice.getAmount() + " FCFA par " + userName + " (" + invoice.getPaymentMethod() + ")")
                                                .timestamp(invoice.getCreatedAt() != null ? invoice.getCreatedAt().toString() : java.time.LocalDateTime.now().toString())
                                                .status(invoice.getStatus().name())
                                                .schoolName(schoolName)
                                                .resourceId(invoice.getId().toString())
                                                .build());
                            } else {
                                return Mono.just(GlobalStatsDto.RecentActivityDto.builder()
                                        .type("INVOICE")
                                        .description("Paiement de " + invoice.getAmount() + " FCFA par " + userName + " (" + invoice.getPaymentMethod() + ")")
                                        .timestamp(invoice.getCreatedAt() != null ? invoice.getCreatedAt().toString() : java.time.LocalDateTime.now().toString())
                                        .status(invoice.getStatus().name())
                                        .schoolName("")
                                        .resourceId(invoice.getId().toString())
                                        .build());
                            }
                        }));

        Flux<GlobalStatsDto.RecentActivityDto> recentEnrollmentActivities = enrollmentRepository.findRecentEnrollments()
                .flatMap(enrollment -> {
                    Mono<String> userMono = userRepository.findById(enrollment.getUserId())
                            .map(user -> user.getFirstName() + " " + user.getLastName())
                            .defaultIfEmpty("Candidat inconnu");
                    Mono<String> schoolMono = schoolRepository.findById(enrollment.getSchoolId())
                            .map(School::getName)
                            .defaultIfEmpty("Auto-école inconnue");
                    Mono<String> offerMono = offerRepository.findById(enrollment.getOfferId())
                            .map(Offer::getName)
                            .defaultIfEmpty("Offre inconnue");
                    return Mono.zip(userMono, schoolMono, offerMono)
                            .map(tuple -> GlobalStatsDto.RecentActivityDto.builder()
                                    .type("ENROLLMENT")
                                    .description("Candidat " + tuple.getT1() + " s'est inscrit à l'offre '" + tuple.getT3() + "'")
                                    .timestamp(enrollment.getCreatedAt() != null ? enrollment.getCreatedAt().toString() : LocalDateTime.now().toString())
                                    .status(enrollment.getStatus().name())
                                    .schoolName(tuple.getT2())
                                    .resourceId(enrollment.getId().toString())
                                    .build());
                });

        Mono<List<GlobalStatsDto.RecentActivityDto>> recentActivitiesMono = Flux.merge(recentSchoolActivities, recentInvoiceActivities, recentEnrollmentActivities)
                .collectList()
                .map(list -> {
                    list.sort((a1, a2) -> a2.getTimestamp().compareTo(a1.getTimestamp()));
                    return list.stream().limit(10).collect(Collectors.toList());
                });

        return Mono.zip(totalUsersMono, totalSchoolsMono, pendingSchoolsMono, totalEnrollmentsMono, totalRevenueMono)
                .flatMap(tuple -> Mono.zip(usersByRoleMono, enrollmentsByStatusMono, revenueByMonthMono, schoolsTrendMono, recentActivitiesMono)
                        .map(subTuple -> GlobalStatsDto.builder()
                                .totalUsers(tuple.getT1())
                                .totalSchools(tuple.getT2())
                                .pendingSchools(tuple.getT3())
                                .totalEnrollments(tuple.getT4())
                                .totalRevenue(tuple.getT5())
                                .usersByRole(subTuple.getT1())
                                .enrollmentsByStatus(subTuple.getT2())
                                .revenueByMonth(subTuple.getT3())
                                .schoolsTrend(subTuple.getT4())
                                .recentActivities(subTuple.getT5())
                                .build()));
    }

    public Flux<School> getAllSchools() {
        return schoolRepository.findAll()
                .sort(Comparator.comparing(School::getName));
    }

    public Mono<School> toggleSchoolVerification(UUID schoolId) {
        return schoolRepository.findById(schoolId)
                .switchIfEmpty(Mono.error(new RuntimeException("Auto-école non trouvée")))
                .flatMap(school -> {
                    boolean nextStatus = !Boolean.TRUE.equals(school.getIsVerified());
                    return schoolRepository.updateVerificationStatus(schoolId, nextStatus)
                            .then(schoolRepository.findById(schoolId));
                });
    }

    public Flux<User> getAllUsers() {
        return userRepository.findAll()
                .sort((u1, u2) -> {
                    String name1 = (u1.getLastName() != null ? u1.getLastName() : "") + " " + (u1.getFirstName() != null ? u1.getFirstName() : "");
                    String name2 = (u2.getLastName() != null ? u2.getLastName() : "") + " " + (u2.getFirstName() != null ? u2.getFirstName() : "");
                    return name1.compareToIgnoreCase(name2);
                });
    }

    public Mono<User> toggleUserActive(UUID userId) {
        return userRepository.findById(userId)
                .switchIfEmpty(Mono.error(new RuntimeException("Utilisateur non trouvé")))
                .flatMap(user -> {
                    boolean nextActive = !Boolean.TRUE.equals(user.getIsActive());
                    return userRepository.updateActiveStatus(userId, nextActive)
                            .then(userRepository.findById(userId));
                });
    }
}
