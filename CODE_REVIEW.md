# Code review — 15 September 2026

Reviewed the Cloudflare entry point and account/product/analytics workers, admin and shop scripts, public page script wiring, local references, and GitHub workflows at base commit `6b683df3fcfaea8d41a7e501cff9e2662d2e0b2d`.

## Fixed

- Admin product listing failed on an original database because `product_clicks` was initialized only for public requests. The existing import regression test reproduced the failure; both list paths now initialize it.
- Renaming a product to an occupied ID overwrote that product. The API now rejects the collision before modifying either product.
- Invalid product prices silently became free products. Negative, non-finite and nonnumeric prices are rejected; executable download URL schemes are also rejected.
- ISO-format session expiry strings were compared lexically to SQLite timestamps, accepting expired sessions until the end of the date. Account and analytics lookups now normalize timestamps with `datetime()`.
- Concurrent password-reset requests could both consume the same token. Password updates now check token validity inside the transactional batch, with conditional session/token revocation and one successful response.
- Missing reset-email sender configuration produced a send failure after token creation. Configuration is checked before processing.
- Customer Online status used a 30-day login cookie instead of recent activity. It now requires an active account, a valid session, and activity within five minutes. Ended website sessions are excluded from active-session counts.
- Google-linked accounts with passwords were incorrectly marked Not Set. Status now reflects whether a password hash exists, without returning the hash.
- The live static homepage did not load analytics: asset-first routing bypassed the HTMLRewriter injection. Public HTML now loads the script explicitly, and the redundant dynamic injection was removed. Hidden tabs stop heartbeats; restored pages resume them.
- Analytics referrers retained query strings, potentially including reset tokens. Client and server strip query strings/fragments, and the reset page uses `no-referrer`.
- Three obsolete repair workflows had invalid YAML and failed on each push. They were removed. Normal CI now also runs product/catalog and analytics regressions on Node 24.
- Internal Markdown/SQL files are excluded from deployed static assets.

## Validation

- All 45 site files pass local-reference and duplicate-ID validation.
- JavaScript files and inline JavaScript parse; remaining workflow YAML parses.
- Nine product/catalog regressions pass, including delete/import persistence, empty catalogs, network failures and rename collisions.
- Workers runtime tests pass for signup, login, duplicates, wrong passwords, logout, ISO session expiration, legacy recovery, one-time reset and concurrent reset requests.
- Analytics regressions pass for recent activity, expired cookies, closed/restored sessions, password status and referrer redaction.
- Wrangler production entry-point dry-run succeeds.

## Limits and follow-up

This is a code review with targeted regression tests, not a guarantee of zero defects. No production customer accounts, reset emails, Google OAuth sessions or product records were created/changed during validation. Real Google login, email delivery and mobile browser interactions still require an authenticated live check. The existing 100,000-iteration PBKDF2 fix passes runtime tests; legacy hashes can still require password reset, which requires working email configuration.

The current free-template WhatsApp flow intentionally returns free links publicly; the separate login-gated free-download endpoint is not used by that UI. This review preserves that existing behavior. Public analytics events and product-click counts remain client-reported and are not abuse-resistant; login counters are not an authoritative security audit log.

Rollback source: branch `backup/pre-admin-audit-2026-09-15`.
