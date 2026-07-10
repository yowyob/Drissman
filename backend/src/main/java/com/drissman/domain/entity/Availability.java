package com.drissman.domain.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.LocalTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("availabilities")
public class Availability {

    @Id
    private UUID id;

    @Column("school_id")
    private UUID schoolId;

    @Column("day_of_week")
    private Integer dayOfWeek; // 1=Monday, 7=Sunday

    @Column("start_time")
    private LocalTime startTime;

    @Column("end_time")
    private LocalTime endTime;

    @Column("max_bookings")
    private Integer maxBookings;
}
