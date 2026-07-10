# Scénario de démonstration — soutenance Drissman

Runbook happy-path, ~12 min. Backend `:8080`, frontend `:3001`.
Comptes de test dans le handoff (section 3).

## 0. Pré-vol (2 min avant de présenter)
- [ ] `docker compose up -d` (PostgreSQL :5433) puis démarrer le backend
      (Liquibase applique les 43 migrations sur base vierge).
- [ ] Démarrer le frontend (`npm run dev`, port 3001).
- [ ] Ouvrir `GET /api/health/kernel` → doit répondre **UP**.
- [ ] Vérifier qu'au moins une école a une **période de formation publiée**
      (sinon elle n'apparaît pas au catalogue — c'est voulu).

## 1. Visiteur / recherche publique (1 min)
1. Page d'accueil → recherche + filtres ville/permis.
2. Carte Leaflet des écoles.
3. Fiche école : note et avis **réels** (aucune donnée fabriquée).
4. Le catalogue ne montre **que** les écoles à session publiée.

## 2. Candidat — inscription + paiement (3 min)
Compte `test.kernel@drissman.cm`.
1. Catalogue → fiche école → **les formules affichent l'image du cours**
   *(nouveau : image côté candidat)*.
2. « S'inscrire » → modal paiement :
   - **MoMo** : saisir un numéro → facture PENDING (école confirmera).
   - **Carte** : ouvre l'URL **Stripe Checkout** dans un onglet.
3. « Mes paiements » : statuts, bouton *Rafraîchir* pour la carte.

## 3. École / admin — gestion (3 min)
Compte `japhetoyie@gmail.com`.
1. **Offres** : CRUD + upload image (archivée dans file-core kernel).
2. **Finances** : la facture MoMo du candidat apparaît →
   *Confirmer* → facture **PAID** + inscription **ACTIVE**
   *(nouveau : reflet best-effort vers cashier-core kernel)*.
3. **Véhicules** : ajouter un véhicule (nom + immatriculation)
   → reflété comme Resource resource-core en arrière-plan.

## 4. Moniteur — géolocalisation temps réel (2 min)
1. Sans séance de conduite active → partage GPS **refusé** (garde métier).
2. Avec une séance CONDUITE/EXAMEN_BLANC en cours → position acceptée.
3. Sur la carte admin (« Flotte ») : marqueur **« En direct »** qui bouge
   via SSE **sans recharger**, et **le trajet se trace en polyligne**
   *(nouveau : trajet du véhicule)*.

## 5. Points d'intégration kernel à mentionner (1 min)
- Compte-miroir kernel créé à chaque inscription (mot de passe dérivé HMAC).
- Écoles → organisations kernel ; véhicules → resources.
- Paiement carte via wallet plateforme (modèle marketplace).
- Callback prestataire : `POST /api/payments/webhook` confirme la facture
  automatiquement (complément du polling), idempotent.

## Repli si un service externe tombe
- Kernel indisponible : tous les reflets sont **best-effort non bloquants**,
  l'appli locale continue (JWT local = source de vérité).
- Stripe indisponible : basculer la démo paiement sur **MoMo + confirmation
  école** (100 % local).
- Backend redémarré / session expirée : se reconnecter (toast explicite).

---
### Nouveautés depuis le dernier commit (à citer)
| Fonctionnalité | Où le voir |
|---|---|
| Image du cours côté candidat | Catalogue → fiche école → formules |
| Trajet véhicule (polyligne) | Carte flotte admin/monitor pendant une séance |
| Webhook paiement | `POST /api/payments/webhook` (auto-confirmation) |
| Reflet cashier-core | À la confirmation d'un paiement (log backend) |
| Tests VehicleService | `mvnw test` → 19 tests verts |
| Barrière CI (tests) | `.gitlab-ci.yml` stage `test` |
