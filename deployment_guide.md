# Guide de Déploiement - Drissman Platform 🚀

Ce document détaille la procédure pour déployer la stack complète (Frontend, Backend, SGBD, Cache) à l'aide de Docker.

## Prérequis

- **Docker** et **Docker Compose** installés sur la machine cible.
- Git (pour cloner le projet si nécessaire).

## Architecture

Le fichier `docker-compose.deployment.yml` orchestre 4 services :
1.  **frontend** : Next.js (Node.js 20-alpine) - Port `3000`.
2.  **backend** : Spring Boot (Java 21-jre-alpine) - Port `8080`.
3.  **postgres** : Base de données (PostgreSQL 16) - Port interne `5432`.
4.  **redis** : Cache distribué (Redis 7) - Port interne `6379`.

## Lancement Rapide

1.  Ouvrez un terminal à la racine du projet `drissman`.
2.  Lancez le déploiement :
    ```bash
    docker-compose -f docker-compose.deployment.yml up -d --build
    ```
    *L'option `--build` force la reconstruction des images Docker.*

3.  Attendez quelques minutes que les conteneurs démarrent et que les healthchecks passent au vert.
    *   Le backend attendra automatiquement que la base de données soit prête.

4.  Accédez à l'application :
    - **Frontend** : `http://localhost:3000`
    - **API Docs** : `http://localhost:8080/swagger-ui.html` (si activé) ou testez `http://localhost:8080/api/health`.

## Commandes Utiles

- **Arrêter les services :**
    ```bash
    docker-compose -f docker-compose.deployment.yml down
    ```

- **Voir les logs (tout) :**
    ```bash
    docker-compose -f docker-compose.deployment.yml logs -f
    ```

- **Voir les logs (backend uniquement) :**
    ```bash
    docker-compose -f docker-compose.deployment.yml logs -f backend
    ```

## Maintenance

- **Base de données** : Les données sont persistées dans le volume Docker `drissman_pg_data`.
- **Mises à jour** : Pour mettre à jour l'application, faites un `git pull` puis relancez la commande `up -d --build`.

## Notes de Production

- Ce setup est "Production-Ready" en termes de conteneurisation (images légères, multi-stage builds).
- Pour un déploiement public (VPS), assurez-vous de configurer un **Reverse Proxy** (Nginx, Traefik) devant le port 3000 pour gérer le HTTPS/SSL.
- Changez les mots de passe par défaut (`drissman_secret`) dans le fichier `docker-compose.deployment.yml` pour plus de sécurité.
