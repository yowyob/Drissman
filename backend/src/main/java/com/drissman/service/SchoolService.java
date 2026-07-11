package com.drissman.service;

import com.drissman.api.dto.SchoolDto;
import com.drissman.domain.entity.School;
import com.drissman.domain.repository.OfferRepository;
import com.drissman.domain.repository.SchoolRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import com.drissman.api.dto.UpdateSchoolRequest;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SchoolService {

        private final SchoolRepository schoolRepository;
        private final OfferRepository offerRepository;
        private final com.drissman.domain.repository.ReviewRepository reviewRepository;

        /** Earth radius in km for Haversine formula */
        private static final double EARTH_RADIUS_KM = 6371.0;

        public Flux<SchoolDto> findAll(String city) {
                Flux<School> schools = (city != null && !city.isBlank())
                                ? schoolRepository.findByCityOrderByRatingDesc(city)
                                : schoolRepository.findAll();

                return schools.flatMap(school -> {
                        final SchoolDto dto = toDto(school);
                        return offerRepository.findBySchoolId(school.getId())
                                        .collectList()
                                        .flatMap(offers -> {
                                                // Filter out schools without offers, unless they are demo schools
                                                if (offers.isEmpty() && !Boolean.TRUE.equals(school.getIsDemo())) {
                                                        return Mono.empty(); // Skip this school
                                                }

                                                // Calculate min price
                                                Integer minPrice = offers.stream()
                                                                .map(com.drissman.domain.entity.Offer::getPrice)
                                                                .min(java.util.Comparator.naturalOrder())
                                                                .orElse(150000); // Fallback price for demo schools
                                                dto.setMinPrice(minPrice);

                                                // Map offers to DTOs
                                                List<SchoolDto.OfferDto> offerDtos = offers.stream()
                                                                .map(offer -> SchoolDto.OfferDto.builder()
                                                                                .id(offer.getId())
                                                                                .name(offer.getName())
                                                                                .description(offer.getDescription())
                                                                                .price(offer.getPrice())
                                                                                .hours(offer.getHours())
                                                                                .permitType(offer.getPermitType())
                                                                                .imageUrl(offer.getImageUrl())
                                                                                .build())
                                                                .toList();
                                                dto.setOffers(offerDtos);

                                                return withReviewCount(dto);
                                        });
                });
        }

        /**
         * Search schools near a given GPS coordinate using Haversine formula.
         * Returns schools sorted by distance (closest first).
         */
        public Flux<SchoolDto> findNearby(double lat, double lng, double radiusKm) {
                return schoolRepository.findAll()
                                .filter(school -> school.getLatitude() != null && school.getLongitude() != null)
                                .filter(school -> haversineDistance(lat, lng, school.getLatitude(),
                                                school.getLongitude()) <= radiusKm)
                                .collectSortedList(Comparator.comparingDouble(
                                                school -> haversineDistance(lat, lng, school.getLatitude(),
                                                                school.getLongitude())))
                                .flatMapMany(Flux::fromIterable)
                                .flatMap(school -> {
                                        final SchoolDto dto = toDto(school);
                                        return offerRepository.findBySchoolId(school.getId())
                                                        .collectList()
                                                        .map(offers -> {
                                                                Integer minPrice = offers.stream()
                                                                                .map(com.drissman.domain.entity.Offer::getPrice)
                                                                                .min(Comparator.naturalOrder())
                                                                                .orElse(150000);
                                                                dto.setMinPrice(minPrice);

                                                                List<SchoolDto.OfferDto> offerDtos = offers.stream()
                                                                                .map(offer -> SchoolDto.OfferDto
                                                                                                .builder()
                                                                                                .id(offer.getId())
                                                                                                .name(offer.getName())
                                                                                                .description(offer
                                                                                                                .getDescription())
                                                                                                .price(offer.getPrice())
                                                                                                .hours(offer.getHours())
                                                                                                .permitType(offer
                                                                                                                .getPermitType())
                                                                                                .build())
                                                                                .toList();
                                                                dto.setOffers(offerDtos);
                                                                return dto;
                                                        });
                                });
        }

        public Mono<SchoolDto> findById(UUID id) {
                if (id == null)
                        return Mono.empty();
                return schoolRepository.findById(id)
                                .flatMap(school -> {
                                        if (school == null)
                                                return Mono.empty();
                                        final SchoolDto dto = toDto(school);
                                        return offerRepository.findBySchoolId(school.getId())
                                                        .map(offer -> SchoolDto.OfferDto.builder()
                                                                        .id(offer.getId())
                                                                        .name(offer.getName())
                                                                        .description(offer.getDescription())
                                                                        .price(offer.getPrice())
                                                                        .hours(offer.getHours())
                                                                        .permitType(offer.getPermitType())
                                                                        .imageUrl(offer.getImageUrl())
                                                                        .build())
                                                        .collectList()
                                                        .map(offers -> {
                                                                dto.setOffers(offers);
                                                                return dto;
                                                        })
                                                        .flatMap(this::withReviewCount);
                                });
        }

        public Mono<SchoolDto> update(UUID id, UpdateSchoolRequest request) {
                return schoolRepository.findById(id)
                                .flatMap(school -> {
                                        if (request.getName() != null)
                                                school.setName(request.getName());
                                        if (request.getDescription() != null)
                                                school.setDescription(request.getDescription());
                                        if (request.getImageUrl() != null)
                                                school.setImageUrl(request.getImageUrl());
                                        if (request.getAddress() != null)
                                                school.setAddress(request.getAddress());
                                        if (request.getCity() != null)
                                                school.setCity(request.getCity());
                                        if (request.getRegion() != null)
                                                school.setRegion(request.getRegion());
                                        if (request.getPhone() != null)
                                                school.setPhone(request.getPhone());
                                        if (request.getEmail() != null)
                                                school.setEmail(request.getEmail());
                                        if (request.getWebsite() != null)
                                                school.setWebsite(request.getWebsite());
                                        return schoolRepository.save(school);
                                })
                                .flatMap(savedSchool -> savedSchool != null ? findById(savedSchool.getId())
                                                : Mono.empty());
        }

        public Mono<School> save(School school) {
                return schoolRepository.save(school);
        }

        /**
         * Calculate distance between two GPS points using the Haversine formula.
         * 
         * @return distance in kilometers
         */
        static double haversineDistance(double lat1, double lon1, double lat2, double lon2) {
                double dLat = Math.toRadians(lat2 - lat1);
                double dLon = Math.toRadians(lon2 - lon1);
                double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                                                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
                double c = 2 * Math.asin(Math.sqrt(a));
                return EARTH_RADIUS_KM * c;
        }

        private SchoolDto toDto(School school) {
                return SchoolDto.builder()
                                .id(school.getId())
                                .name(school.getName())
                                .description(school.getDescription())
                                .address(school.getAddress())
                                .city(school.getCity())
                                .phone(school.getPhone())
                                .email(school.getEmail())
                                .rating(school.getRating())
                                .imageUrl(school.getImageUrl())
                                .latitude(school.getLatitude())
                                .longitude(school.getLongitude())
                                .isVerified(school.getIsVerified())
                                .build();
        }

        /** Complète le DTO avec le nombre réel d'avis. */
        private Mono<SchoolDto> withReviewCount(SchoolDto dto) {
                return reviewRepository.countBySchoolId(dto.getId())
                                .defaultIfEmpty(0L)
                                .map(count -> {
                                        dto.setReviewCount(count);
                                        return dto;
                                });
        }
}
