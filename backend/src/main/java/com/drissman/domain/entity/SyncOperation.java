package com.drissman.domain.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.domain.Persistable;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Registre d'idempotence du mode hors ligne : une ligne par opération cliente
 * (l'id EST la clé d'idempotence, un UUID généré côté client). Rejouer une
 * opération déjà enregistrée retourne le résultat mémorisé sans ré-exécution.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("sync_operations")
public class SyncOperation implements Persistable<UUID> {

    @Id
    private UUID id;

    @Column("user_id")
    private UUID userId;

    @Column("op_type")
    private String opType;

    /** SYNCED, CONFLICT, INVALID — statut au moment du premier traitement. */
    @Column("result_status")
    private String resultStatus;

    @Column("result_message")
    private String resultMessage;

    @Column("created_at")
    private LocalDateTime createdAt;

    /**
     * L'id est fourni par le client (clé d'idempotence) : sans ce marqueur,
     * Spring Data R2DBC tenterait un UPDATE au lieu d'un INSERT.
     * Une SyncOperation n'est jamais mise à jour après création.
     */
    @Transient
    @Builder.Default
    private boolean isNew = true;

    @Override
    public boolean isNew() {
        return isNew;
    }

    @Override
    public UUID getId() {
        return id;
    }
}
