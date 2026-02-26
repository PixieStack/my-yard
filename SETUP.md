# MyYard - Setup Guide

## ✅ What Was Implemented

### 1. Authentication System
- ✅ Email/password authentication only (OAuth removed)
- ✅ SMTP email verification
- ✅ Secure session management
- ✅ Protected routes with role-based access
- ✅ Logo updated to Supabase storage

### 2. Townships & Search
- ✅ 400+ South African townships imported
- ✅ Full-text search API
- ✅ API: `/api/townships`

### 3. Real-time Messaging
- ✅ Conversations between landlord/tenant
- ✅ Real-time message delivery
- ✅ API: `/api/conversations`, `/api/messages`

### 4. Notifications System
- ✅ Real-time notifications
- ✅ Auto-notifications for messages and payments
- ✅ API: `/api/notifications`

### 5. Ozow Payment Integration
- ✅ Move-in payments (deposit + rent + utilities + admin fee)
- ✅ Monthly rent payments
- ✅ Webhook handler
- ✅ Payment history
- ✅ APIs: `/api/payments/*`

---

## 📋 Setup Instructions

### 1. Install Dependencies
```bash
yarn install
```

### 2. Environment Variables

Create `.env.local` file (DO NOT COMMIT THIS FILE):

```env
# Supabase (get from: https://supabase.com/dashboard)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SECRET_KEY=your_secret_key

# Database
DATABASE_URL=your_database_url

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# SMTP (get from: https://brevo.com)
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
SMTP_FROM_EMAIL=noreply@yourdomain.com
SMTP_FROM_NAME=MyYard Team

# Ozow Payments (get from: https://ozow.com)
OZOW_SITE_CODE=your_site_code
OZOW_PRIVATE_KEY=your_private_key
OZOW_API_KEY=your_api_key
OZOW_API_URL=https://stagingapi.ozow.com/PostPaymentRequest
OZOW_IS_TEST=true

# App Owner
APP_OWNER_EMAIL=admin@myyard.co.za
```

**IMPORTANT:** Ask team lead for actual credentials. Never commit `.env.local` to git.

### 3. Database Setup

Execute SQL scripts in Supabase SQL Editor:

1. `/app/scripts/import-townships.sql` - Import 400+ townships
2. `/app/scripts/create-messaging-tables.sql` - Messaging system
3. `/app/scripts/create-notifications-tables.sql` - Notifications
4. `/app/scripts/create-payments-tables.sql` - Payment system

### 4. Build & Run

```bash
# Development
yarn dev

# Production build
yarn build
yarn start
```

---

## 🧪 Testing

### Test Townships API
```bash
curl "http://localhost:3000/api/townships?search=soweto"
```

### Test Notifications
```bash
curl "http://localhost:3000/api/notifications?userId=YOUR_USER_ID"
```

---

## 📁 New Files

### SQL Scripts:
- `/app/scripts/import-townships.sql`
- `/app/scripts/create-messaging-tables.sql`
- `/app/scripts/create-notifications-tables.sql`
- `/app/scripts/create-payments-tables.sql`

### APIs:
- `/app/app/api/conversations/route.ts`
- `/app/app/api/messages/route.ts`
- `/app/app/api/notifications/route.ts`
- `/app/app/api/payments/move-in/route.ts`
- `/app/app/api/payments/rent/route.ts`
- `/app/app/api/payments/notify/route.ts`
- `/app/app/api/payments/history/route.ts`

### Libraries:
- `/app/lib/ozow.ts` - Payment service

---

## 🔐 Security

- Row Level Security (RLS) enabled for all tables
- Webhook hash verification
- Server-side payment calculations
- Protected API routes

---

## 📊 Features

- **14 API endpoints** created
- **6 database tables** added
- **Real-time** messaging and notifications
- **Payment system** with Ozow integration
- **400+ townships** searchable database

---

## 🆘 Support

- Supabase Dashboard: https://supabase.com/dashboard
- Check SQL scripts in `/app/scripts/` folder
- All API routes in `/app/app/api/` folder

---

**Note:** This is your existing app with new features added. All previous functionality remains intact.
