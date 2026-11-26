# Launch checklist

Settings that are switched off or simplified while Welcheq is being built. Every item must be done before real families use the app.

## Must do before launch

- [ ] **Turn email confirmation back on.** It is switched off in Supabase so test accounts can be created quickly.
  1. Connect a free email sender in Supabase under **Authentication → Emails → Set up SMTP**: a Gmail account with an app password, or a Brevo free account.
  2. Under **Authentication → URL Configuration**, set **Site URL** to `https://welcheq-web.onrender.com` and add `https://welcheq-web.onrender.com/**` to **Redirect URLs**.
  3. Under **Authentication → Sign In / Providers**, switch **Confirm email** on and save.
  4. Sign up once with a real address and check the link opens the "Email confirmed" page.
- [ ] **Enable selfie check-ins.** Add `SUPABASE_SECRET_KEY` to the `welcheq-api` service in Render.
- [ ] **Replace test data.** Delete test patients and accounts before inviting real families.

## Planned, not yet switched on

- [ ] Google sign-in (needs a Google OAuth client).
- [ ] Apple sign-in (deferred).
