package com.drissman.kernel;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Journalisation UNIFORME et greppable du mirroring Kernel (best-effort).
 *
 * Le mirroring vers le kernel-core ne bloque jamais le flux local : ses échecs
 * et ses "skips" (école non provisionnée, token-miroir indisponible…) doivent
 * donc rester visibles pour le monitoring, sinon le Kernel peut être contourné
 * silencieusement sans que personne ne le sache.
 *
 * Toutes les lignes partagent le logger nommé "KERNEL_MIRROR" et le format :
 *   KERNEL_MIRROR op=<operation> ref=<ref> outcome=OK|SKIP|FAIL ...
 *
 * Exemples de monitoring (grep / requête de logs) :
 *   - Échecs :   KERNEL_MIRROR .* outcome=FAIL
 *   - Skips  :   KERNEL_MIRROR .* outcome=SKIP
 *   - Alerte :   taux de `outcome=FAIL` (ou `outcome=SKIP`) sur fenêtre glissante.
 *
 * Niveau configurable via  logging.level.KERNEL_MIRROR=INFO|DEBUG.
 */
public final class KernelMirrorLog {

    private static final Logger log = LoggerFactory.getLogger("KERNEL_MIRROR");

    private KernelMirrorLog() {
    }

    /** Succès d'une opération de mirroring (INFO). */
    public static void ok(String op, Object ref, Object detail) {
        log.info("KERNEL_MIRROR op={} ref={} outcome=OK detail={}", op, ref, detail);
    }

    /** Opération volontairement non exécutée, avec sa raison (INFO). */
    public static void skip(String op, Object ref, String reason) {
        log.info("KERNEL_MIRROR op={} ref={} outcome=SKIP reason=\"{}\"", op, ref, reason);
    }

    /** Échec best-effort (WARN) — le flux local n'est pas impacté. */
    public static void fail(String op, Object ref, Throwable e) {
        log.warn("KERNEL_MIRROR op={} ref={} outcome=FAIL error=\"{}\"", op, ref, e.getMessage());
    }

    /**
     * Échec best-effort (WARN) avec un détail supplémentaire — typiquement le
     * corps de la réponse d'erreur du kernel, qui porte la vraie cause (service
     * non autorisé, marchand absent…) là où le message HTTP ne dit que le statut.
     */
    public static void fail(String op, Object ref, Throwable e, String detail) {
        log.warn("KERNEL_MIRROR op={} ref={} outcome=FAIL error=\"{}\" detail=\"{}\"", op, ref, e.getMessage(), detail);
    }

    /**
     * Trace basse d'une opération haute fréquence (ex : observations GPS), en
     * DEBUG pour ne pas noyer les logs de production tout en restant activable.
     */
    public static void trace(String op, Object ref, String outcome) {
        log.debug("KERNEL_MIRROR op={} ref={} outcome={}", op, ref, outcome);
    }
}
