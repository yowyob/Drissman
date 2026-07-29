package com.drissman.service;

import com.drissman.api.dto.NotificationDto;
import com.drissman.domain.entity.Notification;
import com.drissman.domain.entity.User;
import com.drissman.domain.repository.NotificationRepository;
import com.drissman.domain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final WebClient webClient = WebClient.builder().baseUrl("https://exp.host/--/api/v2").build();

    public Mono<Notification> createNotification(UUID userId, String title, String message, String type) {
        Notification notification = Notification.builder()
                .userId(userId)
                .title(title)
                .message(message)
                .type(type)
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();

        return notificationRepository.save(notification)
                .flatMap(saved -> userRepository.findById(userId)
                        .flatMap(user -> {
                            if (user.getPushToken() != null && !user.getPushToken().isEmpty()) {
                                return sendPushNotification(user.getPushToken(), title, message).thenReturn(saved);
                            }
                            return Mono.just(saved);
                        }));
    }

    private Mono<Void> sendPushNotification(String pushToken, String title, String message) {
        return webClient.post()
                .uri("/push/send")
                .bodyValue(Map.of(
                        "to", pushToken,
                        "title", title,
                        "body", message,
                        "sound", "default"
                ))
                .retrieve()
                .bodyToMono(String.class)
                .doOnNext(response -> log.info("Expo push response: {}", response))
                .doOnError(error -> log.error("Error sending push notification: ", error))
                .then()
                .onErrorResume(e -> Mono.empty()); // Ignore errors so it doesn't break the flow
    }

    public Flux<NotificationDto> getUserNotifications(UUID userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .map(this::toDto);
    }

    public Mono<Void> markAsRead(UUID id) {
        return notificationRepository.findById(id)
                .flatMap(notif -> {
                    notif.setIsRead(true);
                    return notificationRepository.save(notif);
                })
                .then();
    }

    public Mono<Void> markAllAsRead(UUID userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .filter(notif -> !notif.getIsRead())
                .flatMap(notif -> {
                    notif.setIsRead(true);
                    return notificationRepository.save(notif);
                })
                .then();
    }

    public Mono<Void> registerPushToken(UUID userId, String token) {
        return userRepository.findById(userId)
                .flatMap(user -> {
                    user.setPushToken(token);
                    return userRepository.save(user);
                })
                .then();
    }

    private NotificationDto toDto(Notification notification) {
        return NotificationDto.builder()
                .id(notification.getId() != null ? notification.getId().toString() : "")
                .title(notification.getTitle())
                .message(notification.getMessage())
                .type(notification.getType())
                .read(notification.getIsRead() != null ? notification.getIsRead() : false)
                .date(notification.getCreatedAt() != null ? notification.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE) : "")
                .build();
    }
}
