# Déploiement DIBOL AI sur Vercel + Neon

## 1. Base de données (déjà faite)

Le projet utilise déjà une base Neon dédiée (`dibol-ai`, région `aws-us-east-1`), séparée de toute autre base. Les migrations Prisma sont appliquées. Rien à faire ici sauf si tu veux créer une base Neon distincte pour la production (recommandé pour garder le dev/test isolé de la prod — voir section 5).

## 2. Créer le projet sur Vercel

1. Pousse le code sur un repo GitHub (le projet a un `.git` local mais rien n'est encore poussé).
2. Sur [vercel.com](https://vercel.com), "Add New → Project", importe le repo.
3. Vercel détecte Next.js automatiquement. Ne change rien aux commandes de build (`npm run build`) — le script `prebuild` (génération du sitemap) et `postinstall` (génération du client Prisma) s'exécutent automatiquement.

## 3. Variables d'environnement à renseigner sur Vercel

Dans **Project Settings → Environment Variables** :

| Variable | Obligatoire | Valeur |
|---|---|---|
| `DATABASE_URL` | ✅ | URL Neon poolée (celle avec `-pooler` dans le host) |
| `DIRECT_URL` | ✅ | URL Neon directe (sans `-pooler`), pour les migrations |
| `AUTH_SECRET` | ✅ | Générer une nouvelle valeur pour la prod : `npx auth secret` |
| `NEXTAUTH_URL` | ✅ | URL finale du site, ex. `https://dibol-ai.vercel.app` |
| `NEXT_PUBLIC_APP_URL` | ✅ | Identique à `NEXTAUTH_URL` |
| `STRIPE_SECRET_KEY` | Pour activer les paiements | Clé **live** (`sk_live_...`) une fois prêt, ou clé test entre temps |
| `STRIPE_WEBHOOK_SECRET` | Pour activer les paiements | Créer un endpoint webhook dans le Dashboard Stripe pointant vers `https://.../api/webhooks/stripe`, copier le secret généré |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Optionnel (non utilisé actuellement) | — |
| `RESEND_API_KEY` | Recommandé (sinon pas d'emails) | Depuis resend.com |
| `EMAIL_FROM` | Recommandé | Nécessite un domaine vérifié dans Resend pour la prod (`onboarding@resend.dev` ne fonctionne qu'en test) |
| `BLOB_READ_WRITE_TOKEN` | ✅ **indispensable** | Voir section 4 — sans ça, les téléchargements de produits ne fonctionneront pas en production |

⚠️ **Ne jamais committer le fichier `.env`** — il est déjà dans `.gitignore`.

## 4. Stockage des fichiers produits (important)

Le système de fichiers de Vercel est **en lecture seule** en production (sauf `/tmp`, non persistant). Le stockage local (`storage/products`) utilisé en développement ne fonctionnera donc pas une fois déployé.

Le code est déjà prêt pour Vercel Blob : dès que `BLOB_READ_WRITE_TOKEN` est présent, `src/lib/storage.ts` bascule automatiquement dessus, sans rien changer ailleurs.

**Étapes :**
1. Dans le dashboard Vercel du projet → onglet **Storage** → **Create Database** → **Blob**.
2. Lie-le au projet : le token `BLOB_READ_WRITE_TOKEN` est alors injecté automatiquement dans les variables d'environnement.
3. Si des produits ont déjà des fichiers uploadés en local (dossier `storage/products`), il faudra les re-uploader depuis l'admin une fois en prod (ils ne sont pas migrés automatiquement).

## 5. Base de données : dev vs prod (recommandé, pas obligatoire)

Pour l'instant, une seule base Neon `dibol-ai` est utilisée partout. Avant d'ouvrir le site au public, il est recommandé de :
- Créer une **branche Neon** dédiée à la production (Neon supporte le branching de bases, gratuit), ou un second projet Neon.
- Utiliser cette base séparée pour `DATABASE_URL`/`DIRECT_URL` sur Vercel, pour ne pas mélanger données de test et données réelles.

## 6. Après le premier déploiement

1. Exécuter les migrations sur la base de prod si elle est différente de celle de dev : `npm run db:migrate` (avec les bonnes variables d'env), ou via `npx prisma migrate deploy` depuis Vercel (peut être ajouté comme étape de build si besoin).
2. Créer le premier compte admin : s'inscrire normalement sur le site déployé, puis promouvoir le compte en `ADMIN` directement dans la base (comme fait en développement).
3. Si Stripe est configuré : tester un paiement test, vérifier que le webhook reçoit bien les événements (`Stripe Dashboard → Developers → Webhooks → logs`).

## Notes techniques

- **Middleware** : `src/middleware.ts` tourne sur l'Edge Runtime de Vercel — c'est pour ça qu'il n'importe jamais Prisma directement (voir `src/lib/auth.config.ts` vs `src/lib/auth.ts`).
- **Warning bénin au build** : un avertissement sur `jose`/`CompressionStream` (dépendance de next-auth) peut apparaître au build. C'est un warning connu et sans impact — il ne concerne qu'un chemin de code (JWE) que ce projet n'utilise pas.
- **Sitemap/robots.txt** : générés à chaque build par `scripts/generate-seo-files.mjs` (fichiers statiques dans `public/`), plutôt que via les conventions `app/sitemap.ts`/`app/robots.ts` de Next.js — contournement nécessaire sur les machines Windows dont le nom d'utilisateur contient une apostrophe (bug du loader webpack de Next.js), voir aussi `public/favicon.ico` et `public/og.png` pour la même raison. N'affecte pas le déploiement sur Vercel (Linux), mais évite aussi tout risque similaire côté build.
