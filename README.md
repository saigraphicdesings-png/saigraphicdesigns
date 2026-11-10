# SAI Frames & Gifts
Standalone photo frame store with its own Cloudflare Worker, customer login and D1 database. This branch does not serve Sai Graphic Designs.

Source branch: sai-frames-gifts. Main remains the design website. Only pushes to this branch deploy the frame store.

Store: https://sai-frames-gifts.sai-graphic-designspagesdev.workers.dev/
Admin: /admin

Build: python3 scripts/embed-assets.py. Deploy with the pinned Wrangler version in the GitHub workflow. ADMIN_TOKEN is a Cloudflare secret, never a source file. Publishing preserves existing secret bindings.

Samples cannot be ordered until prices are confirmed and published from admin. Payments, shipping confirmation and courier updates are manual. Account recovery currently uses customer support.

PIN-code parcel coverage is checked server-side against the official Professional Couriers Network form (Parcel column) and ST Courier Serviceable Area form (Non-Doc Delivery column). Either courier can qualify a destination. Known results are cached for six hours (available) or one hour (unavailable); failed lookups for 45 seconds. Unknown results never claim delivery or unavailability. Customers see locality and remote-area notes; shipping prices and dates remain confirmed separately. Checkout revalidates coverage on the server. Only the destination PIN is sent to the courier lookup sites.
