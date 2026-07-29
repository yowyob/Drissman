package com.drissman.domain.repository;

import com.drissman.domain.entity.ChatMessage;
import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

public interface ChatMessageRepository extends ReactiveCrudRepository<ChatMessage, UUID> {

    @Query("SELECT * FROM chat_messages WHERE (sender_id = :u1 AND recipient_id = :u2) OR (sender_id = :u2 AND recipient_id = :u1) ORDER BY created_at ASC")
    Flux<ChatMessage> findThread(UUID u1, UUID u2);

    @Query("SELECT * FROM chat_messages WHERE (sender_id = :u1 AND recipient_id = :u2) OR (sender_id = :u2 AND recipient_id = :u1) ORDER BY created_at DESC LIMIT 1")
    Mono<ChatMessage> findLatestMessage(UUID u1, UUID u2);

    @Query("SELECT COUNT(*) FROM chat_messages WHERE recipient_id = :recipientId AND sender_id = :senderId AND is_read = false")
    Mono<Long> countUnreadFromSender(UUID recipientId, UUID senderId);

    @Modifying
    @Query("UPDATE chat_messages SET is_read = true WHERE recipient_id = :recipientId AND sender_id = :senderId AND is_read = false")
    Mono<Void> markThreadAsRead(UUID recipientId, UUID senderId);
}
