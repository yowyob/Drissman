# Déploiement sur Vercel 🚀

Vercel est la meilleure solution pour héberger du Next.js. C'est gratuit, rapide, et global.

## Étape 1 : Pousser le code sur GitHub

Comme je ne peux pas accéder à votre compte GitHub, vous devez le faire vous-même :

1.  Créez un **Nouveau Repository** sur [GitHub.com](https://github.com/new) (nommez-le `drissman-platform` par exemple).
2.  Dans votre terminal (à la racine du projet), lancez ces commandes pour lier votre code :
    ```bash
    git remote add origin https://github.com/VOTRE_NOM_UTILISATEUR/drissman-platform.git
    git branch -M main
    git push -u origin main
    ```

## Étape 2 : Connecter Vercel

1.  Allez sur [Vercel.com](https://vercel.com) et connectez-vous avec GitHub.
2.  Cliquez sur **"Add New..."** -> **"Project"**.
3.  Sélectionnez votre repo `drissman-platform`.
4.  Dans les configurations :
    *   **Framework Preset** : Next.js (détecté automatiquement).
    *   **Root Directory** : Cliquez sur `Edit` et sélectionnez le dossier `frontend`. **C'est très important !**
5.  Cliquez sur **Deploy**.

## Et le Backend ?

Sur Vercel, seul le Frontend (Site Vitrine) sera en ligne.
Pour que l'API et la Base de Données fonctionnent, il faudrait déployer le dossier `backend` sur un autre service comme **Railway** ou **Render**.

*Pour l'instant, le site s'affichera parfaitement, mais les formulaires (connexion/inscription) ne marcheront pas.*
