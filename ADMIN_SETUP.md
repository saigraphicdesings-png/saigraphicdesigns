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
- Import Existing Products adds only new IDs. It skips existing products (preserving edits and hidden status) and IDs recorded in deletion history.
- The Worker creates deletion history automatically for existing databases. Deletions made before this update were not recorded; delete any previously restored unwanted products once more after deployment.
- Deleted IDs cannot be reused by the save endpoint, including by older cached admin pages. Create a new product with a new ID if needed.
- Hidden product details and download links are never returned by the public API.


## Product Drive Link

Below the product list, select a product to view its saved download URL and use **Copy Link** to copy it. Visible and hidden products are available to the admin. Deleted products are removed from the selector on refresh.

If the product has no link, edit it and fill in **Download URL** first. The Copy Link button is disabled until a link is available. If clipboard access is blocked, select the displayed link and copy it manually.

This feature requires no Gmail connection, OAuth credentials or email service. Paid product links remain available only through the authenticated admin API; free download links remain available in the shop.

## Gemini conversational assistant

The floating Sai Assistant uses Gemini when the Worker has `GEMINI_API_KEY`.

1. Create an API key in Google AI Studio: https://aistudio.google.com/apikey
2. In Cloudflare, open **Workers & Pages → saigraphicdesigns → Settings → Variables and Secrets → Add**.
3. Choose **Secret**, name it **GEMINI_API_KEY**, and paste the key as its value. Save/deploy the Worker.
4. Refresh `/admin.html`, log in, open **Ask Sai**, and ask a question. The label changes to **Powered by Gemini** after the first successful reply.

Never paste the API key into chat, client JavaScript, or the repository. By default the Worker selects a stable Flash text model returned by Google's models endpoint. Optional plain-text variable `GEMINI_MODEL` pins a specific model; remove an unavailable override to restore automatic selection. Choose a text model supporting structured output in your Google account.

The Worker sends message text, the last eight conversation entries, local task text, aggregate product statistics and up to 100 product summaries to Google. Admin credentials, download URLs and image URLs are excluded. Conversation history stays in page memory and clears on reload/logout; tasks remain in browser storage.

Supported actions: add a local task, complete a numbered task, search products, open analytics. Reports use current product totals and all-time recorded product clicks. Gemini may answer general questions, but has no live web search. It cannot edit/delete products, send messages or schedule reminders. Model actions are validated before execution; no model-generated code or URLs are executed.

Without a key the basic command assistant remains available. Voice recognition and playback still use browser speech services; connecting Gemini does not replace those services. Requests are limited to 20 per minute across the admin assistant and Google quotas also apply. Check your Google AI Studio quota/billing settings; this integration does not guarantee free usage.

Validation: `node scripts/test-gemini.mjs`. Tests mock Google; a successful real reply must still be verified after adding the secret.

API reference: https://ai.google.dev/gemini-api/docs/generate-content/structured-output
