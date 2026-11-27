# Launch checklist

Settings that are switched off or simplified while Welcheq is being built. Every item under "Must do" must be done before real families use the app.

## Must do before launch

- [ ] **Turn email confirmation back on.** It is switched off in Supabase so test accounts can be created quickly.
  1. Connect a free email sender in Supabase under **Authentication → Emails → Set up SMTP**: a Gmail account with an app password, or a Brevo free account.
  2. Under **Authentication → URL Configuration**, set **Site URL** to `https://welcheq-web.onrender.com` and add `https://welcheq-web.onrender.com/**` to **Redirect URLs**.
  3. Under **Authentication → Sign In / Providers**, switch **Confirm email** on and save.
  4. Sign up once with a real address and check the link opens the "Email confirmed" page.
- [ ] **Add the Supabase secret key.** Add `SUPABASE_SECRET_KEY` to the `welcheq-api` service in Render. Until then, selfie check-ins, health record documents and Try the demo stay unavailable, and deleting an account clears the person's data but leaves their sign-in in Supabase.
- [ ] **Turn on pop-up notifications.** Notifications currently appear inside the app with an unread count. To reach a locked phone:
  1. Create a free Firebase project and add an Android app with the package `ng.welcheq.app`.
  2. Upload its FCM v1 service account key to the Expo project under **Credentials**.
  3. Add `expo-notifications`, register each device's push token with the API, and send a push alongside every in-app notification.
  4. Bump the app version and build a new APK, because this adds a native module.
- [ ] **Replace test data.** Delete test patients and accounts before inviting real families.

## Planned, not yet built

- [ ] Agency organisations with several admins sharing the same patients. Today the overview covers the patients each person owns.
- [ ] Reading prescriptions and test results from a photo automatically (photo-to-text).
- [ ] Google sign-in (needs a Google OAuth client).
- [ ] Apple sign-in (deferred).
