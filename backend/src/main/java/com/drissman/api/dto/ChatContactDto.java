package com.drissman.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatContactDto {
    private UUID userId;
    private UUID monitorId;
    private String firstName;
    private String lastName;
    private String name;
    private String email;
    private String phone;
    private String role;
    private UUID offerId;
    private String offerName;
    private String avatarUrl;
    private String lastMsg;
    private String time;
    private Integer unread;
}
