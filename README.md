# Ghizer Union Welfare Organization — Member Portal

A web app for managing cooperative savings, loans, and member accounts — now backed by a **real Postgres database** (via Vercel Postgres) instead of browser storage, so data is permanent and shared across every device.

## Features
- Landing page with organization branding
- **One-time** manager account creation, then normal login afterwards
- Manager dashboard: members, savings, loans, interest, accounting, reports, audit log, settings
- Member login via CNIC + password (set by the manager)
- Member portal: profile photo, balances, loan dues, downloadable statements (PNG/PDF), change password
- **Forgot password** for both manager and members — a 6-digit code is emailed and/or texted
- Responsive design for mobile and desktop

## Architecture
- `index.html` — the frontend (talks to the API below instead of any local/browser storage)
- `api/state.js` — reads/writes the shared cooperative data (members, loans, deposits, etc.) in Postgres
- `api/auth/*.js` — manager & member registration/login/password-change/forgot-password endpoints
- Passwords are hashed (scrypt) before being stored — never saved in plain text

## Required setup (one-time, in the Vercel dashboard)
1. **Database** — Project → **Storage** → Create Database → **Postgres** (free tier) → Connect to this project. Vercel wires up the connection automatically, no copying required.
2. **Email for reset codes** — sign up at [resend.com](https://resend.com) (free), create an API key, then in Project → **Settings → Environment Variables** add:
   - `RESEND_API_KEY`
3. **SMS for reset codes** — sign up at [twilio.com](https://twilio.com) (free trial), then add:
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_FROM_NUMBER`
4. After adding environment variables, **redeploy** (Deployments → ⋯ → Redeploy) so they take effect.

The app works without the email/SMS keys — only the "forgot password" codes won't be delivered until they're configured.
