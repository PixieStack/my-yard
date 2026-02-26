# MyYard - Township Rental Marketplace

**Where Community Finds Home** - South Africa's #1 Township Rental Platform

---

## Quick Setup

### 1. Install Dependencies

```bash
npm install
# or
yarn install
```

### 2. Configure Environment Variables

Copy the example environment file and fill in your credentials:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your values:

```env
# SUPABASE (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SECRET_KEY=your_secret_key

# APP URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# SMTP - Brevo (Required for email verification)
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your_brevo_username
SMTP_PASS=your_brevo_password
SMTP_FROM_EMAIL=noreply@myyard.co.za
SMTP_FROM_NAME=MyYard Team

# OZOW PAYMENTS (Optional - set when ready)
OZOW_SITE_CODE=your_ozow_site_code
OZOW_PRIVATE_KEY=your_ozow_private_key
OZOW_API_KEY=your_ozow_api_key
OZOW_API_URL=https://stagingapi.ozow.com/PostPaymentRequest
OZOW_IS_TEST=true
NEXT_PUBLIC_OZOW_ENABLED=false
```

### 3. Setup Database

Run the SQL scripts in your Supabase SQL editor in this order:

1. `/scripts/setup-database.sql` - Creates all tables and RLS policies
2. `/scripts/import-all-townships.sql` - Imports 873 South African locations (optional - static data is included)

### 4. Start Development Server

```bash
npm run dev
# or
yarn dev
```

Open: **http://localhost:3000**

---

## Features

### Authentication
- Email/password registration with role selection (tenant/landlord)
- Email verification via Brevo SMTP (6-digit OTP code)
- Google OAuth support (requires Supabase dashboard configuration)
- Protected routes with AuthGuard

### Property Management
- Landlord property listings
- 873 South African townships (Soweto, Sandton, Khayelitsha, etc.)
- Property search with autocomplete
- Status tracking (available/occupied/maintenance)

### Tenant Features
- Property search by township
- Application system
- Favorites management
- Real-time messaging with landlords

### Lease Management
- Unit-level pricing (rent, deposit, extras)
- Auto-calculated totals
- Digital signature flow
- PDF export capability
- 20-day cancellation with R300 penalty
- R375 admin fee

### Payment System (Ozow)
- Move-in payments (deposit + first month + extras + admin fee)
- Monthly rent payments (no admin fee)
- Cancellation penalties (R300 hardcoded)
- Payment history and tracking
- Webhook processing for payment confirmation

### Messaging & Notifications
- Real-time messaging (Supabase Realtime)
- Conversation threading by tenant + property
- Notification bell with unread counts
- Real-time notification updates

---

## Tech Stack

- **Framework**: Next.js 15 (App Router) with TypeScript
- **Database**: Supabase (PostgreSQL) with Realtime subscriptions
- **Auth**: Supabase Auth
- **Styling**: Tailwind CSS 4 + shadcn/ui (Radix UI)
- **Payments**: Ozow (South African payment gateway)
- **Email**: Brevo SMTP

---

## API Endpoints

### Townships
- `GET /api/townships` - Search townships with autocomplete
- `GET /api/properties/by-township` - Properties in a township

### Authentication
- `POST /api/auth/send-verification` - Send verification email

### Messaging
- `GET /api/conversations` - Get user conversations
- `POST /api/conversations` - Create conversation
- `GET /api/messages` - Get messages in conversation
- `POST /api/messages` - Send message

### Payments
- `GET/POST /api/payments/ozow` - Ozow payment initiation
- `POST /api/payments/move-in` - Move-in payment
- `POST /api/payments/rent` - Monthly rent payment
- `POST /api/payments/notify` - Ozow webhook handler
- `GET /api/payments/history` - Payment history

### Notifications
- `GET /api/notifications` - Get user notifications

---

## Key Business Rules

1. **Tenant CANNOT edit any amounts** - All amounts are set by landlord
2. **Move-in = deposit + rent + extras + admin fee**
3. **Monthly = rent + extras** (NO admin fee)
4. **Cancellation penalty**: R300 (if <20 days notice without deposit)
5. **Admin fee**: R375 (landlord pays after lease signed)
6. **All amounts verified server-side** before payment

---

## Project Structure

```
/app
├── app/
│   ├── auth/           # Authentication pages
│   ├── landlord/       # Landlord dashboard & pages
│   ├── tenant/         # Tenant dashboard & pages
│   └── api/            # API routes
├── components/         # Reusable UI components
├── lib/               # Utilities & services
│   ├── supabase.ts    # Client-side Supabase
│   ├── supabase-server.ts # Server-side Supabase
│   ├── auth.tsx       # Auth context & hooks
│   ├── ozow.ts        # Ozow payment service
│   └── lease-utils.ts # Lease calculation logic
├── scripts/           # SQL setup scripts
└── public/            # Static assets
```

---

## Remaining Tasks

- [ ] Provide Ozow API key to activate payments
- [ ] Configure Google OAuth in Supabase dashboard
- [ ] Automated rent reminders
- [ ] Deposit return flow
- [ ] Property image upload
- [ ] Advanced search filters

---

**Built for South Africa**
