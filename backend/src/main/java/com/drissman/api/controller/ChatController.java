package com.drissman.api.controller;

import com.drissman.api.dto.ChatContactDto;
import com.drissman.api.dto.ChatMessageDto;
import com.drissman.api.dto.SendMessageRequest;
import com.drissman.service.ChatService;
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
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @GetMapping("/contacts")
    public Flux<ChatContactDto> getContacts(Principal principal) {
        return getUserId(principal)
                .flatMapMany(chatService::getContactsForUser);
    }

    @GetMapping("/messages/{partnerId}")
    public Flux<ChatMessageDto> getMessages(Principal principal, @PathVariable UUID partnerId) {
        return getUserId(principal)
                .flatMapMany(userId -> chatService.getMessagesThread(userId, partnerId));
    }

    @PostMapping("/messages")
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<ChatMessageDto> sendMessage(
            Principal principal,
            @Valid @RequestBody SendMessageRequest request) {
        return getUserId(principal)
                .flatMap(userId -> chatService.sendMessage(userId, request));
    }

    @PutMapping("/messages/{partnerId}/read")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public Mono<Void> markAsRead(Principal principal, @PathVariable UUID partnerId) {
        return getUserId(principal)
                .flatMap(userId -> chatService.markAsRead(userId, partnerId));
    }

    private Mono<UUID> getUserId(Principal principal) {
        if (principal == null || principal.getName() == null) {
            return Mono.error(new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentification requise"));
        }
        try {
            return Mono.just(UUID.fromString(principal.getName()));
        } catch (IllegalArgumentException e) {
            return Mono.error(new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token invalide"));
        }
    }
}
