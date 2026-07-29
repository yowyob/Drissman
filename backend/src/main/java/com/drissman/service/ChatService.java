package com.drissman.service;

import com.drissman.api.dto.ChatContactDto;
import com.drissman.api.dto.ChatMessageDto;
import com.drissman.api.dto.SendMessageRequest;
import com.drissman.domain.entity.*;
import com.drissman.domain.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final OfferMonitorRepository offerMonitorRepository;
    private final MonitorRepository monitorRepository;
    private final OfferRepository offerRepository;
    private final NotificationService notificationService;

    private record ContactOfferPair(User user, String offerName) {}

    public Flux<ChatContactDto> getContactsForUser(UUID userId) {
        return userRepository.findById(userId)
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilisateur introuvable")))
                .flatMapMany(currentUser -> {
                    if (currentUser.getRole() == User.Role.STUDENT) {
                        return getContactsForStudent(currentUser);
                    } else if (currentUser.getRole() == User.Role.MONITOR) {
                        return getContactsForMonitor(currentUser);
                    } else {
                        return getContactsForAdmin(currentUser);
                    }
                });
    }

    private Flux<ChatContactDto> getContactsForStudent(User student) {
        return enrollmentRepository.findByUserId(student.getId())
                .flatMap(enrollment -> offerRepository.findById(enrollment.getOfferId())
                        .flatMapMany(offer -> offerMonitorRepository.findByOfferId(offer.getId())
                                .flatMap(om -> monitorRepository.findById(om.getMonitorId())
                                        .filter(m -> m.getUserId() != null)
                                        .flatMap(m -> userRepository.findById(m.getUserId())
                                                .map(mUser -> new ContactOfferPair(mUser, offer.getName()))
                                        )
                                )
                        )
                )
                .collectList()
                .flatMapMany(list -> {
                    if (list.isEmpty() && student.getSchoolId() != null) {
                        return monitorRepository.findBySchoolId(student.getSchoolId())
                                .filter(m -> m.getUserId() != null)
                                .flatMap(m -> userRepository.findById(m.getUserId())
                                        .map(mUser -> new ContactOfferPair(mUser, "Moniteur Auto-école")));
                    }
                    return Flux.fromIterable(list);
                })
                .distinct(pair -> pair.user().getId())
                .flatMap(pair -> enrichContact(student.getId(), pair.user(), pair.offerName()));
    }

    private Flux<ChatContactDto> getContactsForMonitor(User monitorUser) {
        return monitorRepository.findByUserId(monitorUser.getId())
                .flatMapMany(monitor -> offerMonitorRepository.findByMonitorId(monitor.getId())
                        .flatMap(om -> offerRepository.findById(om.getOfferId())
                                .flatMapMany(offer -> enrollmentRepository.findBySchoolId(monitor.getSchoolId())
                                        .filter(e -> e.getOfferId().equals(offer.getId()))
                                        .flatMap(e -> userRepository.findById(e.getUserId())
                                                .map(student -> new ContactOfferPair(student, offer.getName()))
                                        )
                                )
                        )
                )
                .collectList()
                .flatMapMany(list -> {
                    if (list.isEmpty() && monitorUser.getSchoolId() != null) {
                        return enrollmentRepository.findBySchoolId(monitorUser.getSchoolId())
                                .flatMap(e -> userRepository.findById(e.getUserId())
                                        .map(student -> new ContactOfferPair(student, "Élève Auto-école")));
                    }
                    return Flux.fromIterable(list);
                })
                .distinct(pair -> pair.user().getId())
                .flatMap(pair -> enrichContact(monitorUser.getId(), pair.user(), pair.offerName()));
    }

    private Flux<ChatContactDto> getContactsForAdmin(User admin) {
        if (admin.getSchoolId() == null) return Flux.empty();
        return enrollmentRepository.findBySchoolId(admin.getSchoolId())
                .flatMap(e -> userRepository.findById(e.getUserId())
                        .map(student -> new ContactOfferPair(student, "Élève")))
                .distinct(pair -> pair.user().getId())
                .flatMap(pair -> enrichContact(admin.getId(), pair.user(), pair.offerName()));
    }

    private Mono<ChatContactDto> enrichContact(UUID currentUserId, User partner, String offerName) {
        return chatMessageRepository.findLatestMessage(currentUserId, partner.getId())
                .flatMap(lastMsg -> chatMessageRepository.countUnreadFromSender(currentUserId, partner.getId())
                        .map(unreadCount -> buildContactDto(partner, offerName, lastMsg, unreadCount.intValue()))
                )
                .defaultIfEmpty(buildContactDto(partner, offerName, null, 0));
    }

    private ChatContactDto buildContactDto(User partner, String offerName, ChatMessage lastMsg, int unreadCount) {
        String fullName = ((partner.getFirstName() != null ? partner.getFirstName() : "") + " " +
                (partner.getLastName() != null ? partner.getLastName() : "")).trim();
        if (fullName.isEmpty()) {
            fullName = partner.getEmail();
        }

        String formattedTime = "";
        if (lastMsg != null && lastMsg.getCreatedAt() != null) {
            formattedTime = lastMsg.getCreatedAt().format(DateTimeFormatter.ofPattern("HH:mm"));
        }

        return ChatContactDto.builder()
                .userId(partner.getId())
                .firstName(partner.getFirstName())
                .lastName(partner.getLastName())
                .name(fullName)
                .email(partner.getEmail())
                .phone(partner.getPhone())
                .role(partner.getRole() != null ? partner.getRole().name() : "")
                .offerName(offerName)
                .avatarUrl(partner.getAvatarUrl())
                .lastMsg(lastMsg != null ? lastMsg.getContent() : "Aucun message")
                .time(formattedTime)
                .unread(unreadCount)
                .build();
    }

    public Flux<ChatMessageDto> getMessagesThread(UUID currentUserId, UUID partnerId) {
        return chatMessageRepository.markThreadAsRead(currentUserId, partnerId)
                .thenMany(chatMessageRepository.findThread(currentUserId, partnerId))
                .map(msg -> mapToDto(msg, currentUserId));
    }

    public Mono<ChatMessageDto> sendMessage(UUID senderId, SendMessageRequest request) {
        ChatMessage message = ChatMessage.builder()
                .senderId(senderId)
                .recipientId(request.getRecipientId())
                .offerId(request.getOfferId())
                .content(request.getContent().trim())
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();

        return userRepository.findById(senderId)
                .flatMap(sender -> {
                    String senderName = ((sender.getFirstName() != null ? sender.getFirstName() : "") + " " +
                            (sender.getLastName() != null ? sender.getLastName() : "")).trim();
                    if (senderName.isEmpty()) senderName = "Un utilisateur";

                    final String finalSenderName = senderName;

                    return chatMessageRepository.save(message)
                            .flatMap(savedMsg -> notificationService.createNotification(
                                            request.getRecipientId(),
                                            "Message de " + finalSenderName,
                                            request.getContent(),
                                            "CHAT"
                                    )
                                    .onErrorResume(e -> {
                                        log.warn("Erreur d'envoi de notification de chat: {}", e.getMessage());
                                        return Mono.empty();
                                    })
                                    .thenReturn(savedMsg)
                            );
                })
                .map(msg -> mapToDto(msg, senderId));
    }

    public Mono<Void> markAsRead(UUID currentUserId, UUID partnerId) {
        return chatMessageRepository.markThreadAsRead(currentUserId, partnerId);
    }

    private ChatMessageDto mapToDto(ChatMessage message, UUID currentUserId) {
        boolean isMe = message.getSenderId().equals(currentUserId);
        String formattedTime = message.getCreatedAt() != null
                ? message.getCreatedAt().format(DateTimeFormatter.ofPattern("HH:mm"))
                : "";

        return ChatMessageDto.builder()
                .id(message.getId())
                .senderId(message.getSenderId())
                .recipientId(message.getRecipientId())
                .offerId(message.getOfferId())
                .content(message.getContent())
                .isRead(message.getIsRead())
                .isMe(isMe)
                .time(formattedTime)
                .createdAt(message.getCreatedAt())
                .build();
    }
}
