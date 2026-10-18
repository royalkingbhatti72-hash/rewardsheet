# Royal Rewards — Frontend Application

This is the independent client application for Royal Rewards built with React, Vite, and Tailwind CSS.

## 🚀 Running Locally

```bash
cd frontend
npm run dev
```
The frontend dev server will run at: `http://localhost:5173`

## ⚙️ Environment Configuration (`.env`)

```env
# URL where your backend is hosted
VITE_API_URL=http://localhost:5050/api
```

## 🌐 Setting Up a Separate Domain in Production

1. Deploy this folder (`/frontend`) to your static hosting (e.g. Vercel, Netlify, Cloudflare Pages, S3).
2. Point your user domain (e.g. `app.yourdomain.com` or `yourdomain.com`) to this frontend.
3. In your hosting environment variables, set:
   ```env
   VITE_API_URL=https://api.yourdomain.com/api
   ```
   (Replace `https://api.yourdomain.com/api` with your actual backend API domain).
4. Build command: `npm run build`
5. Output directory: `dist`
