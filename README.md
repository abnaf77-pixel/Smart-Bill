# Smart Bill

Government document compiler — generate Tour (TA) Bills and LTC Advance applications in exact official format, ready to print and sign.

## What's inside

- `src/App.jsx` — the entire application (forms, PDF-style print layouts, dashboard, drafts)
- `src/main.jsx` — React entry point
- `src/index.css` — Tailwind setup
- `index.html` — page shell, fonts, meta tags
- Drafts are saved in the browser's `localStorage` — they stay on the device they were created on; there is no shared server database yet.

## Run it locally (optional, needs Node.js installed)

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`.

## Deploy to Vercel (the actual launch step)

1. Push this folder to a new GitHub repository.
2. Go to vercel.com → "Add New Project" → import that GitHub repo.
3. Vercel auto-detects Vite. Leave all settings as default. Click **Deploy**.
4. You'll get a free live URL like `smart-bill-yourname.vercel.app` within about a minute.
5. Every time you push new code to GitHub, Vercel automatically redeploys — no extra steps.

## Connect a custom domain later (optional)

In the Vercel project → Settings → Domains → enter your purchased domain (e.g. `smartbillapp.in`) → follow the DNS instructions Vercel shows you → done. HTTPS is automatic and free.

## Known limitations (by design, for this stage)

- No backend database — drafts live in each browser's local storage only, not shared across devices.
- Login is a simple name + contact form with no real OTP verification yet — intentional, to keep onboarding friction at zero while you validate the product with real officers.
- Two forms are live (TA Bill, LTC Advance). Four more are shown as "Coming soon" placeholders on the bill-type picker.
