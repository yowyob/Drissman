package com.drissman.domain.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("offers")
public class Offer {

    @Id
    private UUID id;

    @Column("school_id")
    private UUID schoolId;

    private String name;

    private String description;

    private Integer price;

    private Integer hours;

    @Column("permit_type")
    private String permitType; // A, B, C, D, E, F, G, etc.

    /** Image de présentation du cours (colonne présente depuis la migration 009). */
    @Column("image_url")
    private String imageUrl;
}
