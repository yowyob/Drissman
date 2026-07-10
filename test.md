# 🧪 Workflow de test — Création d'une organisation Kernel pour une auto-école

Ce document décrit pas à pas comment provisionner une auto-école Drissman en
**organisation** sur le kernel-core (yowyob), via les endpoints du backend
Drissman (qui relaient vers le kernel avec l'identité machine).

> **Principe** : le frontend/testeur ne parle **jamais** directement au kernel.
> Le backend Drissman porte les headers `X-Client-Id` / `X-Api-Key` /
> `X-Tenant-Id` automatiquement.

---

## Prérequis

| Élément | Valeur |
|---|---|
| Backend Drissman | `http://localhost:8080` (démarré, Postgres Docker up) |
| Compte local admin | `admin.ecole@drissman.cm` / `AdminEcole2026!` (rôle SCHOOL_ADMIN) |
| Compte kernel admin | `platform-admin` (mot de passe : voir image des identifiants) |
| Codes MFA | reçus sur l'email de Savio (`saviojtsafack...@gmail.com`) |

Variables utilisées ci-dessous (PowerShell) :

```powershell
$BASE = "http://localhost:8080"
```

---

## Étape 0 — Se connecter au backend Drissman (token local)

Les endpoints `/api/kernel/admin/**` exigent un rôle SCHOOL_ADMIN ou SUPER_ADMIN.

```powershell
$login = Invoke-RestMethod "$BASE/api/auth/login" -Method POST -ContentType "application/json" `
  -Body '{"email":"admin.ecole@drissman.cm","password":"AdminEcole2026!"}'
$H = @{ Authorization = "Bearer $($login.token)" }
```

*Équivalent curl :*
```bash
TOKEN=$(curl -s -X POST $BASE/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"admin.ecole@drissman.cm","password":"AdminEcole2026!"}' | jq -r .token)
```

---

## Étape 1 — Ouvrir la session admin kernel (déclenche le MFA)

**Endpoint Drissman** : `POST /api/kernel/admin/login`
*(relaye vers kernel `POST /api/auth/login`)*

```powershell
Invoke-RestMethod "$BASE/api/kernel/admin/login" -Method POST -Headers $H -ContentType "application/json" `
  -Body '{"principal":"platform-admin","password":"<MOT_DE_PASSE_ADMIN>"}'
```

**Réponse attendue :**
```json
{ "status": "MFA_REQUIRED", "channel": "EMAIL", "expiresInSeconds": 300,
  "next": "POST /api/kernel/admin/mfa/confirm { \"code\": \"XXXXXX\" }" }
```

⏱️ **Le code expire en 5 minutes** — consulter l'email de Savio immédiatement.

---

## Étape 2 — Valider le code MFA

**Endpoint Drissman** : `POST /api/kernel/admin/mfa/confirm`
*(relaye vers kernel `POST /api/auth/login/mfa/confirm` avec le mfaToken gardé côté serveur)*

```powershell
Invoke-RestMethod "$BASE/api/kernel/admin/mfa/confirm" -Method POST -Headers $H -ContentType "application/json" `
  -Body '{"code":"123456"}'
```

**Réponse attendue :**
```json
{ "status": "CONNECTED", "expiresInSeconds": 900 }
```

La session admin kernel (15 min) est conservée **en mémoire du backend**.
Vérifiable à tout moment :

```powershell
Invoke-RestMethod "$BASE/api/kernel/admin/status" -Headers $H
# { "connected": true, "expiresInSeconds": 842 }
```

---

## Étape 3 — Provisionner l'école en organisation kernel

**Endpoint Drissman** : `POST /api/kernel/admin/organizations/{schoolId}`

Ce seul appel enchaîne côté kernel :
1. `POST /api/actors/onboarding` — crée le **business actor** (propriétaire)
2. `POST /api/organizations` — crée l'**organisation** (`ORG-<ECOLE>-XXXX`)
3. `POST /api/organizations/{orgId}/services` × 4 — souscrit **ACCOUNTING,
   BILLING, CASHIER, HRM** (avec header `X-Organization-Id`)
4. Enregistre le mapping local : `schools.kernel_organization_id`

Récupérer un `schoolId` :
```powershell
docker exec drissman-postgres psql -U drissman -d drissman -t -A `
  -c "SELECT id || ' | ' || name FROM schools;"
```

Lancer le provisionnement :
```powershell
Invoke-RestMethod "$BASE/api/kernel/admin/organizations/11111111-1111-1111-1111-111111111111" `
  -Method POST -Headers $H | ConvertTo-Json -Depth 3
```

**Réponse attendue (succès) :**
```json
{
  "status": "PROVISIONED",
  "schoolId": "11111111-...",
  "organizationId": "<uuid-org-kernel>",
  "organizationCode": "ORG-CONDUITEPRO-1111",
  "services": { "ACCOUNTING": "OK", "BILLING": "OK", "CASHIER": "OK", "HRM": "OK" }
}
```

### Cas particuliers

| Réponse | Signification | Action |
|---|---|---|
| `ALREADY_PROVISIONED` | L'école a déjà son organisation | Rien à faire |
| `OWNER_ASSIGNED_RECONNECT` | Le compte admin n'avait pas `organizations:write` ; le rôle OWNER vient de lui être attribué automatiquement | Refaire **Étapes 1-2** (nouveau token = nouvelles permissions) puis relancer l'Étape 3 |
| `401 Session admin kernel absente ou expirée` | Token 15 min expiré | Refaire Étapes 1-2 |
| Service en `ERREUR: ...` | Souscription partielle (quota, dépendance CASHIER→ACCOUNTING...) | Relancer l'étape ou souscrire manuellement |

---

## Étape 4 — Vérifications

**Côté Drissman (mapping en base) :**
```powershell
docker exec drissman-postgres psql -U drissman -d drissman -t -A `
  -c "SELECT name, kernel_organization_id FROM schools WHERE kernel_organization_id IS NOT NULL;"
```

**Côté kernel (directement, avec l'identité machine + token admin) :**
```bash
curl -s https://kernel-core.yowyob.com/api/organizations/my \
  -H "X-Client-Id: prod-platform-backend" -H "X-Api-Key: <API_KEY>" \
  -H "X-Tenant-Id: 11111111-1111-1111-1111-111111111111" \
  -H "Authorization: Bearer <ACCESS_TOKEN_ADMIN>" | jq
```

---

## Référence rapide des endpoints

### Backend Drissman (nouveaux)
| Méthode | Route | Rôle |
|---|---|---|
| POST | `/api/kernel/admin/login` | Ouvre le login kernel, déclenche le MFA email |
| POST | `/api/kernel/admin/mfa/confirm` | Valide le code MFA, stocke le token 15 min |
| GET  | `/api/kernel/admin/status` | Session admin active ? |
| POST | `/api/kernel/admin/organizations/{schoolId}` | Provisionne l'école en organisation |

### Kernel (appelés en coulisses)
| Méthode | Route | Usage |
|---|---|---|
| POST | `/api/auth/login` | Login (→ 200 token ou `CONFIRM_MFA`) |
| POST | `/api/auth/login/mfa/confirm` | `{mfaToken, code}` → accessToken |
| POST | `/api/actors/onboarding` | Business actor propriétaire |
| POST | `/api/organizations` | Création de l'organisation |
| POST | `/api/organizations/{id}/services` | Souscription (`X-Organization-Id` requis) |
| GET  | `/api/users/me` | Identité du token courant |
| GET  | `/api/administration/roles` | Liste des rôles (id du rôle OWNER) |
| POST | `/api/administration/users/{id}/roles` | Attribution OWNER (auto-fix 403) |

---

## Pièges connus

- ⏱️ Token kernel = **15 min**, code MFA = **5 min** : préparer l'email avant de lancer.
- 🔁 Après toute attribution de rôle : **se reconnecter** (les permissions sont
  figées dans le token émis).
- 📧 Les comptes créés par sign-up restent `EMAIL_VERIFICATION_REQUIRED` tant
  que le lien reçu par email n'est pas cliqué (adresses réelles uniquement) —
  demande de désactivation en cours auprès de l'équipe kernel.
- 🔒 Ne jamais mettre l'API key ou un token kernel dans le frontend ou dans Git.
