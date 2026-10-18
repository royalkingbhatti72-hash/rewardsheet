# Earn Sheet / Royal Rewards — Frontend Application

This is the independent client application for Earn Sheet / Royal Rewards built with React, Vite, Tailwind CSS, and Supabase integration.

---

## 🚀 Running Locally

```bash
cd frontend
npm install
npm run dev
```

* Dev server runs at: `http://localhost:5173`

---

## ⚙️ Environment Configuration (`.env`)

```env
VITE_API_URL=http://localhost:5050/api
VITE_SUPABASE_URL=https://ilrngvidbuenxfgsbpim.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_4EqCtWIiEIwm3ETQvxeOgA_fUcSKkiJ
```

---

## ☁️ Vercel Deployment Settings

1. Connect the repository `https://github.com/royalkingbhatti72-hash/rewardsheet` to Vercel.
2. Framework Preset: **Vite**
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. In **Project Settings** $\rightarrow$ **Environment Variables**, configure:
   * `VITE_API_URL`: `https://<your-backend-project>.vercel.app/api`
   * `VITE_SUPABASE_URL`: `https://ilrngvidbuenxfgsbpim.supabase.co`
   * `VITE_SUPABASE_ANON_KEY`: `sb_publishable_4EqCtWIiEIwm3ETQvxeOgA_fUcSKkiJ`
