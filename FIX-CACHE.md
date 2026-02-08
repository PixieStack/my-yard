# 🔧 FIX SUPABASE URL ERROR

## Problem:
Browser is using OLD Supabase URL: `dyqntanxtjxytreqtcud.supabase.co`

Should be using: `pbyhhzygikyucqogitwj.supabase.co`

---

## ✅ SOLUTION:

### Step 1: Clear Browser Cache

**In Chrome/Edge:**
1. Open DevTools: Press `F12`
2. Right-click the refresh button
3. Click "Empty Cache and Hard Reload"

**OR:**
- Press `Ctrl + Shift + Delete`
- Select "Cached images and files"
- Click "Clear data"

---

### Step 2: Verify .env.local

Run this to check:
```powershell
cd C:\Users\thwal\Documents\projects\my-yard\app
type .env.local
```

Should show:
```
NEXT_PUBLIC_SUPABASE_URL=https://pbyhhzygikyucqogitwj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

---

### Step 3: Restart App

```powershell
# Stop the app (Ctrl+C)
# Then restart:
npm run dev
```

---

### Step 4: Push Database

```powershell
node push-to-remote-supabase.js
```

---

### Step 5: Test Registration

1. Go to: http://localhost:3000
2. Click "Get Started Free"
3. Fill the form
4. Register

---

**The old URL is cached in your browser. Clear cache and it will work!** 🚀
