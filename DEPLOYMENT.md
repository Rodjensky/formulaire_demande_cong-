# Guide de Déploiement — Plateforme Multi-Entreprises de Gestion des Congés

Ce guide détaille les étapes complètes pour déployer la plateforme en production sur l'infrastructure **Cloudflare** (Cloudflare Workers / Pages avec base de données **Cloudflare D1**).

---

## 1. Prérequis

- Un compte [Cloudflare](https://dash.cloudflare.com/) actif.
- [Node.js](https://nodejs.org/) v20+ et npm installés localement.
- Le CLI Cloudflare Wrangler installé globalement ou via `npx wrangler`.
- Un compte [Resend](https://resend.com) pour les emails.
- Un compte [Meta for Developers](https://developers.facebook.com) avec l'API WhatsApp Business Cloud configurée.

---

## 2. Étape 1 : Connexion à Cloudflare via Wrangler

Dans votre terminal, connectez-vous à votre compte Cloudflare :

```bash
npx wrangler login
```

Vérifiez l'authentification :

```bash
npx wrangler whoami
```

---

## 3. Étape 2 : Création de la Base de Données Cloudflare D1

Créez la base de données D1 dédiée :

```bash
npx wrangler d1 create leave-management-db
```

Wrangler affichera la configuration à copier dans votre `wrangler.toml`, par exemple :

```toml
[[d1_databases]]
binding = "DB"
database_name = "leave-management-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

Reportez ce `database_id` dans votre fichier `wrangler.toml`.

---

## 4. Étape 3 : Application des Migrations SQL sur D1

### A. En Local (pour tester avec Wrangler en local)
```bash
npx wrangler d1 execute leave-management-db --local --file=./scripts/schema.sql
```

### B. En Production (sur Cloudflare D1 distant)
```bash
npx wrangler d1 execute leave-management-db --remote --file=./scripts/schema.sql
```

---

## 5. Étape 4 : Configuration des Secrets Cloudflare

Définissez les variables secrètes de production sur Cloudflare à l'aide de Wrangler :

```bash
# Clé secrète de chiffrement des sessions (minimum 32 caractères aléatoires)
npx wrangler secret put SESSION_SECRET

# Clé API Resend
npx wrangler secret put RESEND_API_KEY

# Clés WhatsApp Business Cloud API
npx wrangler secret put WHATSAPP_ACCESS_TOKEN
npx wrangler secret put WHATSAPP_PHONE_NUMBER_ID
npx wrangler secret put WHATSAPP_BUSINESS_ACCOUNT_ID

# Clés Cloudflare Turnstile
npx wrangler secret put TURNSTILE_SECRET_KEY
```

---

## 6. Étape 5 : Initialisation des Données (Seed Production)

Pour créer le compte Super Administrateur initial en production :

```bash
# Exécution du script de seed en production si souhaité
npm run db:seed
```

Comptes démo pré-configurés :
- **Super Admin** : `superadmin@platform.local` / `SuperAdmin2026!`
- **Technozi Admin** : `admin@technozi.demo` / `AdminPass123!`
- **Welj Admin** : `admin@welj.demo` / `AdminPass123!`

---

## 7. Étape 6 : Déploiement sur Cloudflare

### Option A : Déploiement avec OpenNext / Cloudflare Workers
```bash
# Build de production
npm run build

# Déploiement avec Wrangler
npx wrangler deploy
```

### Option B : Déploiement via Cloudflare Pages & Git
1. Connectez votre dépôt Git à **Cloudflare Pages**.
2. Sélectionnez le framework preset **Next.js**.
3. Associez le binding D1 `DB` dans les paramètres **Settings > Functions > D1 Database Bindings**.
4. Configurez les variables d'environnement dans **Settings > Environment variables**.
5. Lancez le build de production.

---

## 8. Étape 7 : Tests Post-Déploiement

Vérifiez le bon fonctionnement de la plateforme en production :

1. Accédez à l'URL de votre application : `https://conges.votredomaine.com`.
2. Soumettez une demande de test sur le formulaire public `/submit`.
3. Vérifiez la génération du numéro `CONG-2026-XXXX` et l'accès à la page `/request/[token]`.
4. Connectez-vous sur `/login` avec le compte `admin@technozi.demo`.
5. Consultez le tableau de bord `/admin/dashboard`, validez ou refusez la demande.
6. Connectez-vous sur `/login` avec le compte `superadmin@platform.local` et vérifiez les métriques globales sur `/super-admin`.
