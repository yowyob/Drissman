# 🚂 Guide de Déploiement Backend sur Railway

Ce guide explique comment déployer le backend Spring Boot de Drissman sur Railway.

## 1. Création du projet sur Railway

1.  Connectez-vous à [Railway.app](https://railway.app/).
2.  Cliquez sur **+ New Project**.
3.  Sélectionnez **Deploy from GitHub repo**.
4.  Choisissez votre dépôt `aphelion-granule`.
5.  Lorsqu'on vous demande le dossier racine, **ne sélectionnez rien pour l'instant** (nous allons configurer Railway pour pointer sur le dossier `backend`).

## 2. Configuration du dossier Backend

1.  Une fois le projet créé, allez dans les **Settings** du service.
2.  Dans la section **General**, cherchez **Root Directory**.
3.  Entrez `/backend`.
4.  Railway détectera automatiquement le `Dockerfile` présent dans ce dossier.

## 3. Ajout des Bases de Données

Dans votre projet Railway, cliquez sur **+ New** :
1.  **Database** -> **Add PostgreSQL**.
2.  **Database** -> **Add Redis**.

## 4. Configuration des Variables d'Environnement

Allez dans l'onglet **Variables** de votre service backend et ajoutez les variables suivantes (Railway remplira automatiquement certaines valeurs si vous utilisez les variables de référence) :

| Variable | Valeur (Référence Railway) |
| :--- | :--- |
| **`SPRING_R2DBC_URL`** | `r2dbc:postgresql://${{Postgres.PGHOST}}:${{Postgres.PGPORT}}/${{Postgres.PGDATABASE}}` |
| **`SPRING_LIQUIBASE_URL`** | `jdbc:postgresql://${{Postgres.PGHOST}}:${{Postgres.PGPORT}}/${{Postgres.PGDATABASE}}` |
| **`SPRING_DATASOURCE_URL`** | `jdbc:postgresql://${{Postgres.PGHOST}}:${{Postgres.PGPORT}}/${{Postgres.PGDATABASE}}` |
| `SPRING_R2DBC_USERNAME` | `${{Postgres.PGUSER}}` |
| `SPRING_R2DBC_PASSWORD` | `${{Postgres.PGPASSWORD}}` |
| `SPRING_DATASOURCE_USERNAME` | `${{Postgres.PGUSER}}` |
| `SPRING_DATASOURCE_PASSWORD` | `${{Postgres.PGPASSWORD}}` |

---

## 🛠️ Dépannage (Troubleshooting)

### Les logs défilent à l'infini et l'application crash ?

Si vous voyez des milliers de lignes de type `DEBUG ... Loaded liquibase.sqlgenerator`, c'est que le mode "Debug" est activé (soit globalement, soit pour Liquibase). Cela consomme énormément de mémoire et peut faire crasher votre instance Railway.

**Action recommandée :**
Ajoutez ces variables pour calmer les logs et optimiser la mémoire :

| Key | Value | But |
| :--- | :--- | :--- |
| **`LOGGING_LEVEL_LIQUIBASE`** | `INFO` | Arrête le spam de Liquibase |
| **`LOGGING_LEVEL_ROOT`** | `INFO` | Force le mode normal pour tout l'appli |
| **`JAVA_TOOL_OPTIONS`** | `-Xmx384m` | Empêche Java de dépasser la mémoire autorisée |

### Pourquoi ça crashait ?
Le scan initial de Liquibase est très gourmand en RAM. En mode `DEBUG`, chaque fichier scanné génère une ligne de log, ce qui sature le CPU et la mémoire. En passant en `INFO` et en limitant la mémoire du tas (`-Xmx`), l'application devient stable.
| `JWT_SECRET` | `votre_secret_tres_long_et_securise` |

> [!IMPORTANT]
> Notez l'utilisation de `r2dbc:postgresql://` dans l'URL de la base de données pour supporter le mode réactif du backend.

### 5. Liaison avec le Frontend (Vercel)

Une fois le backend déployé, Railway vous donnera une URL (ex: `https://aphelion-granule-production.up.railway.app`).

1.  Allez sur votre projet **Vercel**.
2.  Allez dans **Settings** -> **Environment Variables**.
3.  Ajoutez ou modifiez la variable `NEXT_PUBLIC_API_URL`.
4.  **VALEUR CRITIQUE** : L'URL doit être complète. Elle doit commencer par **`https://`** et se terminer par **`/api`**.
    *   Exemple correct : **`https://`**`aphelion-granule-production.up.railway.app/api`
    *   **Attention** : Si vous oubliez le `https://`, le navigateur croira que c'est un dossier local et affichera une erreur **404**.
5.  **Redéployez** le frontend sur Vercel (allez dans l'onglet "Deployments", cliquez sur les trois petits points du dernier déploiement et faites "Redeploy").

---
Besoin d'aide ? N'hésitez pas à me demander !

---

## 🛠️ Dépannage : Les tables n'apparaissent pas ?

Si votre Postgres est "Online" mais vide, voici les étapes à suivre :

1.  **Vérifiez les Logs** : Cliquez sur le service `aphelion-granule` -> Onglet **Deployments** -> Cliquez sur le déploiement actif -> **View Logs**.
2.  **Cherchez les Erreurs** :
    *   Si vous voyez `Connection refused`, c'est que les variables d'URL (JDBC/R2DBC) sont mal configurées.
    *   Si vous voyez `Access denied` ou `Authentication failed`, vérifiez vos variables `USERNAME` et `PASSWORD`.
3.  **Vérifiez les Variables** : Assurez-vous d'avoir SEPARÉ `SPRING_R2DBC_URL` (commence par `r2dbc:`) et `SPRING_DATASOURCE_URL` (commence par `jdbc:`). Liquibase a besoin du préfixe `jdbc:`.
4.  **Redémarrez** : Si vous avez corrigé des variables, Railway relance normalement le service, mais vous pouvez cliquer sur **"Restart Service"** dans les Settings pour être sûr.
