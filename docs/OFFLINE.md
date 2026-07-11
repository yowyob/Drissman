# Mode hors ligne Drissman — fonctionnement, limites, procédure de test

## 1. Analyse de l'existant et périmètre

Le mode hors ligne cible l'**espace moniteur** (usage terrain : voiture, zones
mal couvertes). Constat sur le code existant : il n'y a **pas** d'entité
« présence/absence » dans Drissman ; la saisie terrain existante est la
**validation de séance avec notes pédagogiques**
(`PATCH /monitors/me/sessions/{id}/complete`). Le besoin « présences /
observations » est donc porté par cette fonctionnalité, sans créer de nouveau
domaine métier.

### Disponible hors ligne (après un premier accès en ligne)
| Fonctionnalité | Mode | Mécanisme |
|---|---|---|
| Planning du moniteur | lecture | cache IndexedDB, Network First, TTL 24 h |
| Élèves assignés | lecture | idem |
| Flotte de véhicules | lecture | idem |
| Profil utilisateur | lecture | session locale existante |
| Validation de séance + notes | écriture | file d'attente, sync différée |
| Positions GPS (séance autorisée) | écriture | file d'attente, append-only |
| Brouillons de formulaires | local | type `FORM_DRAFT`, jamais synchronisé |

### Obligatoirement en ligne (jamais mis en file ni en cache)
Création de compte / authentification initiale ; paiements (Stripe, Mobile
Money) et confirmations ; toute opération Kernel-Core ; vérification de
documents ; données jamais chargées auparavant. Le type d'opération est
validé côté serveur : un type non autorisé (ex. paiement) est rejeté
`INVALID` même s'il est injecté dans la file.

## 2. Flux de synchronisation

```
   SAISIE HORS LIGNE                    RETOUR DU RÉSEAU
┌──────────────────────┐   ┌──────────────────────────────────────────┐
│ action moniteur      │   │ sonde /api/health OK (pas navigator.only)│
│  └─ enqueue()        │   │  └─ runSync() auto (ou bouton manuel)    │
│     opId = UUID      │   │     1. SYNCING orphelins -> PENDING      │
│     status PENDING   │   │     2. sélection PENDING échus, ordre    │
│     IndexedDB.queue  │   │        de création, lots de 25          │
└──────────────────────┘   │     3. POST /api/sync/batch (JWT)        │
                           └──────────────────┬───────────────────────┘
                                              │
                    BACKEND (revalide autorisations + règles métier)
                    ┌─────────────────────────▼─────────────────────┐
                    │ opId déjà en sync_operations ?                │
                    │   oui -> ALREADY_PROCESSED (résultat mémorisé)│
                    │   non -> exécute via services existants       │
                    │     séance déjà COMPLETED/annulée -> CONFLICT │
                    │     règle métier violée         -> INVALID    │
                    │     panne transitoire      -> TEMPORARY_ERROR │
                    │     sinon INSERT sync_operations  -> SYNCED   │
                    └─────────────────────────┬─────────────────────┘
                                              │ verdicts par opId
                    ┌─────────────────────────▼─────────────────────┐
                    │ CLIENT applique le verdict (jamais de         │
                    │ suppression avant confirmation) :             │
                    │  SYNCED/ALREADY -> SYNCED                     │
                    │  CONFLICT -> CONFLICT (bandeau, intervention) │
                    │  INVALID  -> FAILED (définitif, affiché)      │
                    │  TEMPORARY -> PENDING + backoff 5s·3^n ≤10min │
                    │  HTTP 401 -> stop, file intacte, re-login     │
                    └───────────────────────────────────────────────┘
```

## 3. Choix techniques et justification

- **PWA + Service Worker maison** (`public/sw.js`) : Cache First pour le
  statique, Network First pour les navigations avec repli sur le shell.
  **Les données métier ne passent pas par le cache SW** : elles sont gérées
  en **IndexedDB** par l'application, seul moyen de garantir l'isolation par
  utilisateur, un TTL contrôlé et la purge à la déconnexion. Aucune réponse
  d'API (jetons, paiements) n'est mise en cache par le SW (`/api/` exclu).
- **IndexedDB sans dépendance** (`lib/offline/db.ts`) : deux magasins,
  `cache` (clé `userId::nom`, horodatage) et `queue` (clé = `opId`).
  localStorage n'est pas utilisé pour les données métier.
- **Clé d'idempotence = opId** (UUID client) : c'est la clé primaire de la
  table `sync_operations` (migration 044) ; l'unicité est donc garantie par
  la base, y compris entre deux synchronisations concurrentes
  (`Persistable#isNew` force l'INSERT ; le doublon devient
  `ALREADY_PROCESSED`).
- **Détection réseau** : `navigator.onLine` n'est qu'un indice ; la
  disponibilité réelle est sondée sur `/api/health` (timeout 4 s, période
  25 s) — un réseau actif avec backend injoignable est traité comme hors
  ligne.
- **Conflits — pas de « dernière écriture gagnante »** :
  - séance déjà validée/modifiée côté serveur → `CONFLICT` signalé au
    moniteur (bandeau), rien n'est écrasé ; le champ `baseStatus` envoyé par
    le client et `sessions.updated_at` (migration 044) portent le
    versionnage ;
  - planning : lecture seule côté client → la version serveur est prioritaire
    par construction, l'indicateur « données du dernier accès » informe ;
  - positions GPS : append-only, ajout à l'historique sans écrasement ;
  - brouillons (`FORM_DRAFT`) : jamais envoyés, version locale conservée ;
  - paiements : aucun type de sync n'existe pour eux (`INVALID` si forgé).
- **Authentification** : le JWT local reste la seule session ; hors ligne
  n'est possible qu'après un login en ligne réussi ; à l'expiration (401 sur
  la sync) la file est conservée intacte et une ré-authentification est
  demandée ; le mot de passe n'est jamais stocké ; aucun secret Kernel ne
  transite par le frontend (relais backend inchangé).
- **Sécurité des données locales** : isolation par `userId` dans les clés,
  purge complète à la déconnexion **et** au changement de compte
  (`AuthContext`), journaux sans données sensibles (messages d'erreur
  seulement).

## 4. Fichiers ajoutés / modifiés

Backend : `changes/044-offline-sync.yaml` (table `sync_operations` +
`sessions.updated_at`), `entity/SyncOperation`, `repository/SyncOperationRepository`,
`service/SyncService`, `dto/SyncBatchRequest`, `dto/SyncOperationResult`,
`controller/SyncController` ; `SessionService` (updated_at à la complétion).

Frontend : `lib/offline/{db,sync-core,sync,network,offline-fetch}.ts`,
`components/offline/offline-bar.tsx`, `components/pwa/sw-register.tsx`,
`public/{manifest.json,sw.js}` + icônes ; pages moniteur
(planning/students/tracking) branchées ; `AuthContext` (purge) ;
`app/layout.tsx` (manifest + SW) ; layout moniteur (barre hors ligne).

## 5. Tests

Automatisés : `mvnw test` → 24 tests (dont 5 `SyncServiceTest` : idempotence,
conflit « déjà validée », conflit « modifiée entre-temps », premier passage,
type inconnu) ; `npm test` (vitest) → 9 tests `sync-core` (sélection/ordre,
transitions de verdict, backoff plafonné, reprise après interruption,
compteurs).

Procédure manuelle (matrice demandée) :
1. **Ouverture sans connexion après 1er usage** : visiter le planning en
   ligne, couper le réseau (DevTools > Network > Offline), recharger →
   bandeau rouge + « données du dernier accès ».
2. **Saisies hors ligne** : valider 2–3 séances → toast « validée
   localement », compteur « en attente » dans la barre.
3. **Reconnexion** : réactiver le réseau → sync automatique, toast bilan.
4. **Interruption** : couper le réseau pendant l'envoi → les opérations
   restent/reviennent PENDING, renvoyées à la passe suivante.
5. **Rejeu** : renvoyer le même `opId` (2 clics sync rapprochés) → une seule
   exécution serveur (`ALREADY_PROCESSED`).
6. **JWT expiré** : attendre l'expiration puis synchroniser → message
   « Session expirée », file intacte, re-login puis sync OK.
7. **Conflit** : valider une séance hors ligne, la faire valider par l'admin
   côté serveur, se reconnecter → statut CONFLICT dans « Détails ».
8. **Changement d'utilisateur** : se déconnecter / connecter un autre compte
   → cache et file du premier utilisateur purgés (IndexedDB vide pour lui).
9. **Backend down, réseau actif** : arrêter le backend → la sonde /health
   classe l'application hors ligne malgré `navigator.onLine = true`.
10. **Volume** : générer > 25 opérations → envoi par lots ordonnés de 25.

## 6. Limites connues

- Périmètre écriture limité à la validation de séance et aux positions GPS
  (seules écritures terrain existantes) ; extensible en ajoutant un type
  d'opération côté client et un `case` dans `SyncService`.
- La garde « séance de conduite active » des positions GPS est revalidée **au
  moment de la synchronisation** : des positions saisies pendant une séance
  terminée entre-temps seront rejetées `INVALID` (choix de sécurité).
- Les données IndexedDB ne sont pas chiffrées (limite des API web standard) ;
  l'isolation par utilisateur et la purge à la déconnexion réduisent
  l'exposition sur appareil partagé.
- Le TTL de 24 h rend le cache inutilisable au-delà — c'est voulu (données
  potentiellement périmées).
- `sync_operations` croît avec l'usage ; une purge périodique (> 30 jours)
  pourra être ajoutée (tâche planifiée) sans impact fonctionnel.
