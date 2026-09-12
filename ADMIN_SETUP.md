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

- The Shop displays only visible products returned by the admin database.
- Use **Import Existing Products** once to bring the original catalog into the admin panel.
- Deleting a product removes it from the Shop. Hiding a product keeps it in the admin panel only.
- An empty database produces an empty Shop; old built-in products are never added back.
- If the database is unavailable, the Shop displays a retry message instead of outdated products.
- The Shop refreshes its catalog when you return to the tab or restore the page from browser history.
- Import Existing Products explicitly restores the original products, so do not repeat the import after deleting items unless you want to restore them.
- Hidden product details and download links are never returned by the public API.
