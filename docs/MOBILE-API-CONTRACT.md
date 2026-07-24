# Contrat d'API mobile → backend web Drissman

> **Décision d'architecture (2026-07-23) : un seul backend.**
> L'application mobile consomme **directement le backend web de production**. Le fork
> « drissman mobile backend » est **abandonné** : ne plus le déployer, ne plus le maintenir.
> Règle : *c'est le mobile qui s'adapte au web*, jamais l'inverse.

Ce document liste ce que l'équipe mobile (client) doit changer, et le contrat cible.

---

## 1. Base URL (changement obligatoire)

Toutes les requêtes passent désormais par la prod web :

```
https://drisman.yowyob.com/drisman-api/api/...
```

⚠️ Le domaine réel n'a **qu'un seul « s »** : `drisman.yowyob.com` (pas « drissman »).
Le préfixe est `/drisman-api/api/`. Exemple : `POST /drisman-api/api/auth/login`.

---

## 2. Ce que le mobile DOIT retirer / adapter

### a) Connexion Google — À RETIRER
L'endpoint `POST /api/auth/google` **n'existe pas** sur le backend web (pas de
`google.client.id` provisionné). Retirer le bouton « Se connecter avec Google ».
Auth = email/mot de passe uniquement (JWT Drissman local, voir §3).

### b) Création de session — CHANGEMENT DE CONTRAT
Le backend web modélise une session comme **une inscription**, pas une liste d'offres.

| Ancien (fork mobile) | Nouveau (web, obligatoire) |
|---|---|
| `POST /api/schools/admin/sessions` body `{ offerIds: [uuid, ...] }` | `POST /api/schools/admin/sessions` body `{ enrollmentId: uuid, ... }` |

`enrollmentId` est **obligatoire** (`@NotNull`) — un body sans lui renvoie `400`.
Il n'y a **pas** d'affectation de moniteurs par offre (`monitorIds`), ni de
tables `session_course_offers` / `offer_monitors` côté web. Les moniteurs sont
affectés au niveau de la session.

Endpoints d'aide à la création (web) :
- `GET /api/schools/admin/sessions/available-offers`
- `GET /api/schools/admin/sessions/available-enrollments`

---

## 3. Authentification (inchangé sur le principe)

JWT **Drissman local** (pas Kernel), en header `Authorization: Bearer <token>`.

- `POST /api/auth/register` → `{ user: {...}, token }`
- `POST /api/auth/login` → `{ user: {...}, token }`
- `POST /api/auth/upgrade-visitor` (authentifié)

`user` (dans `AuthResponse`) contient : `id, email, firstName, lastName, role,
schoolId, avatarUrl`. Rôles : `VISITOR, CANDIDAT, SCHOOL_ADMIN, MONITOR, SUPER_ADMIN`.

---

## 4. Nouveau champ disponible : avatarUrl (photo de profil)

Porté dans le web à la demande. Disponible sans changement d'appel :
- Présent dans `UserDto`, `AuthResponse.user`, `GET /api/users/me`, `GET /api/users/{id}`.
- Modifiable : `PUT /api/users/{id}` avec `{ "avatarUrl": "<url>" }` (+ `firstName`,
  `lastName`, `email` optionnels).
- Upload d'image : `POST /api/images/upload` (multipart) → renvoie une URL à mettre
  dans `avatarUrl`.

---

## 5. Le mobile récupère « gratuitement » (déjà en prod web)

Aucune action mobile requise côté backend, ces capacités sont déjà servies :
- Intégration Kernel (best-effort) : notifications, paiement Payment Core (MyCoolPay),
  gouvernance écoles, search yowyob, HRM moniteurs.
- KYC : upload des pièces école et moniteur, revue super-admin.
  - `GET|POST /api/schools/admin/documents` (multipart pour POST)
  - `GET|POST /api/schools/admin/documents/monitors/{monitorId}`
- Éligibilité avis : `GET /api/reviews/eligibility/{schoolId}`
- Super-admin étendu : rejet d'école, documents, réindexation search, revue de pièces.

---

## 6. Contrat d'endpoints (référence, backend web)

Auth : `/api/auth/{register,login,upgrade-visitor}`
Users : `GET /api/users/me`, `GET|PUT /api/users/{id}`, `PUT /api/users/{id}/password`
Écoles (public) : `GET /api/schools`, `/api/schools/nearby`, `/api/schools/{id}`
Offres (public) : `GET /api/offers/school/{schoolId}`, `/api/offers/{id}`, `/api/offers/{offerId}/modules`
Inscriptions : `POST /api/enrollments`, `GET /api/enrollments/me`, `/api/enrollments/me/sessions`
Paiements : `POST /api/payments/initiate`, `GET /api/payments/me`, `POST /api/payments/webhook`, `GET /api/payments/{invoiceId}/refresh`
Avis : `POST /api/reviews`, `GET /api/reviews/school/{schoolId}`, `GET /api/reviews/eligibility/{schoolId}`
Espace moniteur : `GET /api/monitors/me`, `/api/monitors/me/sessions`, `PATCH /api/monitors/me/sessions/{id}/complete`, `GET /api/monitors/me/students`
Véhicules : `GET /api/vehicles/school/{schoolId}`, `POST /api/vehicles/{vehicleId}/position`, `GET /api/vehicles/school/{schoolId}/stream` (SSE)
Périodes de formation publiées : `GET /api/training-periods/published/school/{schoolId}`
Images : `POST /api/images/upload`, `GET /api/images/{filename}`
Santé : `GET /api/health`, `GET /api/health/kernel`

Espace gérant (`SCHOOL_ADMIN`) sous `/api/schools/admin/...` :
`dashboard`, `stats`, `PATCH /` (profil école), `enrollments`, `invoices`, `payments`,
`modules`, `monitors`, `offers`, `reviews`, `sessions`, `training-periods`, `vehicles`,
`documents` (KYC).

Super-admin (`SUPER_ADMIN`) sous `/api/superadmin/...` :
`stats`, `schools/pending`, `PUT schools/{id}/validate`, `PUT schools/{id}/reject`,
`GET schools/{id}/documents`, `POST search/reindex`, `GET schools/{schoolId}/monitors`,
`GET monitors/{monitorId}/documents`, `PUT documents/{documentId}/review`,
`GET schools`, `PUT schools/{id}/toggle-verify`, `GET users`, `PUT users/{id}/toggle-active`.

---

## 7. Checklist de bascule côté mobile

- [ ] Base URL → `https://drisman.yowyob.com/drisman-api/api`
- [ ] Retirer l'écran / le bouton « Se connecter avec Google »
- [ ] Création de session : envoyer `enrollmentId` (obligatoire), plus `offerIds`
- [ ] Retirer toute logique `monitorIds` sur les offres et le modèle offres↔session
- [ ] Vérifier la désérialisation de `avatarUrl` (nouveau champ, optionnel)
- [ ] Tester login → token → appels authentifiés `Bearer`
