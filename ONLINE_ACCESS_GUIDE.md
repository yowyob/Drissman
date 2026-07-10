# Comment mettre votre site en ligne (Sur Internet) ? 🌍

Pour l'instant, votre site tourne en **local** (sur votre ordinateur uniquement). Pour que vos clients puissent y accéder, vous devez l'héberger sur un serveur public.

Voici les 3 meilleures options pour votre configuration Docker actuelle :

## Option 1 : Serveur VPS (Recommandé pour Docker) 🏆
C'est la méthode pour laquelle j'ai préparé les fichiers `docker-compose`. 

1.  **Louer un VPS** : Chez un hébergeur comme **OVH**, **DigitalOcean**, ou **Hetzner** (environ 5-10€/mois).
    *   *OS recommandé* : Ubuntu 22.04 ou 24.04.
2.  **Installer Docker** sur le serveur :
    ```bash
    curl -fsSL https://get.docker.com | sh
    ```
3.  **Copier vos fichiers** : Transférez le dossier du projet vers le serveur (via `git clone` ou `scp`).
4.  **Lancer le site** :
    ```bash
    docker compose -f docker-compose.deployment.yml up -d --build
    ```
5.  **Domaine** : Achetez un nom de domaine (ex: `drissman.cm`) et pointez-le vers l'IP de votre serveur.

## Option 2 : Cloud PaaS (Vercel + Railway) ☁️
Si vous ne voulez pas gérer de serveur (Linux) :

1.  **Frontend** : Déployez le dossier `frontend` sur **Vercel** (gratuit pour les projets perso/hobby).
    *   Vercel gère automatiquement Next.js.
2.  **Backend & DB** : Déployez le dossier `backend` et la base de données sur **Railway** ou **Render**.
    *   *Note* : Il faudra modifier les variables d'environnement pour que le Frontend Vercel parle au Backend Railway.

## Option 3 : Tunnel Temporaire (Pour démo rapide) ⏱️
Si vous voulez juste montrer le site à quelqu'un *maintenant* sans payer :

1.  Utilisez un outil comme **ngrok** ou **Cloudflare Tunnel**.
2.  Commande (exemple avec ngrok) :
    ```bash
    ngrok http 3000
    ```
3.  Cela vous donnera une URL publique (ex: `https://abcd-123.ngrok-free.app`) qui pointe vers votre ordinateur.
    *   *Attention* : Le site se coupe dès que vous éteignez votre ordinateur.

---

### Résumé
- **Actuellement** : Visible seulement par VOUS (`localhost:3000`).
- **Pour le public** : Il faut louer un VPS (Option 1) et y lancer les commandes Docker que j'ai préparées.
