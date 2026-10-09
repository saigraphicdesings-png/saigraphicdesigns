# Sai Graphic Designs Website

Official website source for **Sai Graphic Designs**, a graphic design, branding and printing studio in Madurai, Tamil Nadu.

## Website

- Production: https://saigraphicdesigns.sai-graphic-designspagesdev.workers.dev/
- GitHub Pages source branch: `main`

## Main pages

- `index.html` — homepage
- `about.html` — company profile
- `customizer.html` — services and quotation customizer
- `shop.html` — design template shop
- `contact.html` — project inquiry and contact details

## Technology

Static HTML, CSS and JavaScript, deployed with GitHub Pages. No build step is required.

## Local preview

Run a local static server from the repository root:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Maintenance checklist

- Give every shop product a unique ID.
- Upload every image referenced by `shop.js`.
- Compress large images before committing.
- Keep canonical URLs and structured-data URLs on `https://saigraphicdesigns.sai-graphic-designspagesdev.workers.dev/`.
- Update `sitemap.xml` whenever a public page is added or removed.

## Contact

Sai Graphic Designs  
Madurai, Tamil Nadu  
Phone: +91 63811 28781  
Email: saigraphicdesings@gmail.com

All brand assets and portfolio work remain the property of their respective owners.

## Offline Billing Book

Open **Admin → Billing** (`admin-billing.html`) after admin login. The first online visit caches the billing page for offline use in the existing authenticated tab/session. The book stores customers, services, invoices, drafts, receipts and cash entries in IndexedDB on the current browser/device. It does not sync to D1 or other devices. Export backups from App Settings regularly; restore merges by record ID and keeps existing records. Clearing browser data removes this book.

Invoices use integer paise, item quantities, discounts and optional payments. No GST is charged. Invoice payment receipts affect cash and customer balances; moving an invoice to the recycle bin also moves its linked receipts. Restoring the invoice recovers those linked receipts. Draft invoices do not affect balances.

Browser integration verification: install Playwright and its Chromium browser, then run `node scripts/test-billing.mjs`. Optionally set `BILLING_CHROMIUM_PATH` to an installed Chromium executable. The test covers totals, payment limits, recycle recovery, draft handling, cash balance, backup deduplication, offline reload and saving, and mobile overflow.
