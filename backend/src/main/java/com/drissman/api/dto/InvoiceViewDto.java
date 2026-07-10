package com.drissman.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceViewDto {
    private UUID id;
    private UUID enrollmentId;
    private String invoiceNumber;
    private String studentName;
    private String offer;
    private Integer amount;
    private String status;
    private LocalDateTime dueDate;
    private LocalDateTime paidAt;
}
