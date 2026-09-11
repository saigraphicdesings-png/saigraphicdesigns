# Sai Graphic Designs Shop Admin Setup

The admin panel code is available at `/admin.html`. Complete these one-time Cloudflare steps before using it.

## 1. Create the D1 database

In Cloudflare Dashboard, open **Workers & Pages → D1 SQL Database → Create database**.

Use this name:

```
sai-shop-products
```

## 2. Create the products table

Open the new database console and run the complete contents of `schema.sql`.

## 3. Bind the database to the Worker

Open the **saigraphicdesigns** Worker:

**Settings → Bindings → Add binding → D1 database**

Use:

- Variable name: `DB`
- D1 database: `sai-shop-products`

## 4. Add the admin secret

Open:

**Settings → Variables and Secrets → Add**

Use:

- Variable name: `ADMIN_TOKEN`
- Type: Secret
- Value: create a long private password of at least 20 characters

Never add the secret value to GitHub files.

## 5. Redeploy

Redeploy the latest `main` branch, then open:

```
https://saigraphicdesigns.sai-graphic-designspagesdev.workers.dev/admin.html
```

Enter the same `ADMIN_TOKEN` value to access the product manager.

## How products work

- Products created in D1 are added to the existing Shop.
- A D1 product with the same ID replaces the matching built-in product.
- Hiding that D1 product also hides the matching built-in product.
- Existing products remain available as a fallback if D1 is temporarily unavailable.
- Hidden product details and download links are never returned by the public API.
