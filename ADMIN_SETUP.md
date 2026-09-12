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


## Send Product by Email — Gmail connection

The new section below the product list sends the selected product's saved HTTPS download link to one customer email address. Sending requires the existing admin login. It does not email a customer automatically when they select a product in the public shop.

1. In your Google Cloud project, enable the **Gmail API** and configure the OAuth consent screen for your own sender account.
2. Create an **OAuth web application client**. To obtain credentials through [Google OAuth Playground](https://developers.google.com/oauthplayground/), register `https://developers.google.com/oauthplayground` as an authorized redirect URI and enter your own client ID and client secret in the Playground's settings.
3. Authorize the sender Gmail account with only the `https://www.googleapis.com/auth/gmail.send` scope, then exchange the authorization code for tokens. Obtain offline access and retain the refresh token securely. The sender must be the authorized Gmail account or its configured send-as alias. See [Google's OAuth web-server guide](https://developers.google.com/identity/protocols/oauth2/web-server#offline) for production consent settings and refresh-token lifetime restrictions; testing-mode tokens may expire.
4. In Cloudflare, open the `saigraphicdesigns` Worker → Settings → Variables and Secrets. Add these values **as secrets**, never in GitHub or frontend code:
   - `GOOGLE_CLIENT_ID`: your OAuth client ID.
   - `GOOGLE_CLIENT_SECRET`: your OAuth client secret.
   - `GOOGLE_REFRESH_TOKEN`: the refresh token for the sender account.
   The confirmed sender, `saigraphicdesings@gmail.com`, is already set as `GMAIL_SENDER` in `wrangler.jsonc`. Authorize this same account; no separate sender secret is needed.
5. Deploy the Worker and refresh the admin panel. The email section displays the configured sender. No email is sent by configuration or by opening the panel.
6. Save an HTTPS download URL on the product. Select the product, enter the customer's email, inspect the preview, and click **Send Product Email**. Paid download links are not returned in the public shop API.

The Worker submits UTF-8 MIME messages using [Gmail's messages.send API](https://developers.google.com/workspace/gmail/api/guides/sending). A success message means Gmail accepted the message, not that delivery to the inbox is confirmed. If a connection drops while submitting, check the sender's Gmail Sent folder before sending again; the Worker never automatically retries an uncertain send.

The Gmail connection in ChatGPT, if installed, is separate from these deployed Worker credentials. Never paste account passwords, client secrets or refresh tokens in chat.
