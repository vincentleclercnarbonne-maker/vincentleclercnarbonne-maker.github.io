# Activation des connexions

Déployer ce dossier comme projet Vercel en choisissant `linkedin-app` comme **Root Directory**.

## Variables Vercel obligatoires

- `APP_URL` : URL finale du projet Vercel, sans slash final.
- `APP_ENCRYPTION_KEY` : phrase secrète longue et aléatoire.
- `LINKEDIN_CLIENT_ID`
- `LINKEDIN_CLIENT_SECRET`
- `LINKEDIN_VERSION` : par défaut `202605`.
- `CANVA_CLIENT_ID`
- `CANVA_CLIENT_SECRET`
- `CANVA_SCOPES` : par défaut `openid profile design:meta:read design:content:write asset:read asset:write`.
- `PRESTASHOP_BASE_URL` : `https://www.technimat-outillage.fr`
- `PRESTASHOP_API_KEY` : clé Webservice en lecture seule.

## URL de retour LinkedIn

`https://VOTRE-PROJET.vercel.app/api/callback/linkedin`

Produits LinkedIn à activer :

- Sign In with LinkedIn using OpenID Connect
- Share on LinkedIn

## URL de retour Canva

`https://VOTRE-PROJET.vercel.app/api/callback/canva`

Activer les scopes demandés dans l’intégration Canva.

## Sécurité

Les jetons sont chiffrés dans des cookies sécurisés et ne sont jamais ajoutés au dépôt GitHub. Pour les automatisations hors connexion et une conservation durable multi-appareils, remplacer ensuite les cookies par une base de données sécurisée.
