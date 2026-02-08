# 🏘️ MyYard - Township Rental Marketplace

**"Where Community Finds Home"**

MyYard is a modern property management and rental marketplace platform designed specifically for the South African township and suburban rental market. Connect landlords with reliable tenants through a secure, community-focused digital platform.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and Yarn
- Supabase account
- Modern web browser

### 1. Clone and Install

```bash
cd /app
yarn install
```

### 2. Environment Setup

The `.env.local` file is already configured with Supabase credentials.

### 3. Database Setup

**Important:** Run these SQL scripts in your Supabase SQL Editor (https://supabase.com/dashboard/project/YOUR_PROJECT/sql) in order:

1. **First**, run `/app/scripts/complete-setup.sql` - Sets up all database tables, types, and security policies
2. **Then**, run `/app/scripts/insert-locations.sql` - Inserts all South African townships, suburbs, and CBDs

### 4. Run the Development Server

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ✨ Features

### For Landlords
- 📊 **Comprehensive Dashboard** - Track properties, applications, and revenue
- 🏠 **Property Management** - List and manage unlimited properties
- 📝 **Application Review** - Screen and approve tenant applications
- 💰 **Payment Tracking** - Monitor rent payments and overdue accounts
- 🔧 **Maintenance Management** - Handle tenant maintenance requests
- 📧 **Messaging System** - Direct communication with tenants

### For Tenants
- 🔍 **Smart Search** - Find properties by township, suburb, or CBD
- ❤️ **Favorites** - Save properties for later viewing
- 📄 **Easy Applications** - Apply for properties with one click
- 📅 **Viewing Requests** - Schedule property viewings online
- 💳 **Payment History** - Track your rental payments
- ⭐ **Reviews & Ratings** - Build your tenant reputation

---

## 🎨 Design Philosophy

MyYard features a modern, professional design with:
- **Emerald & Teal Gradient Theme** - Fresh, trustworthy, and welcoming
- **Responsive Layout** - Works beautifully on desktop, tablet, and mobile
- **Smooth Animations** - Delightful micro-interactions
- **Accessible UI** - Built with Radix UI components for accessibility
- **Township-Focused** - Designed for South African communities

---

## 🗂️ Project Structure

```
/app
├── app/                    # Next.js app directory
│   ├── auth/              # Authentication pages (login, register)
│   ├── landlord/          # Landlord portal pages
│   ├── tenant/            # Tenant portal pages
│   ├── page.tsx           # Homepage
│   └── layout.tsx         # Root layout
├── components/            # Reusable UI components
│   ├── ui/               # Shadcn UI components
│   └── auth-guard.tsx    # Authentication guard
├── lib/                   # Utilities and configs
│   ├── supabase.ts       # Supabase client
│   ├── auth.tsx          # Auth context provider
│   └── utils.ts          # Helper functions
├── public/               # Static assets
│   └── myyard-logo.svg   # Brand logo
├── scripts/              # Database setup scripts
│   ├── complete-setup.sql     # Main database schema
│   └── insert-locations.sql   # SA locations data
└── .env.local           # Environment variables
```

---

## 🗄️ Database Schema

### Core Tables
- **profiles** - Base user profiles
- **tenant_profiles** - Tenant-specific data
- **landlord_profiles** - Landlord-specific data
- **townships** - SA locations (townships, suburbs, CBDs)
- **properties** - Property listings
- **property_images** - Property photos
- **applications** - Rental applications
- **viewing_requests** - Property viewing appointments
- **leases** - Active rental agreements
- **payments** - Rent payment tracking
- **messages** - In-app messaging
- **favorites** - Saved properties
- **reviews** - User ratings and reviews

### Location System
The platform includes comprehensive South African locations:
- **9 Provinces** - All SA provinces covered
- **150+ Locations** - Townships, suburbs, and CBDs
- **Smart Filtering** - Search by province → city → location type

---

## 🔐 Authentication & Security

- **Supabase Auth** - Secure email/password authentication
- **Row Level Security (RLS)** - Database-level access control
- **Role-Based Access** - Separate landlord and tenant permissions
- **Email Verification** - Confirm user accounts via email
- **Secure Password Storage** - Industry-standard encryption

---

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI + Shadcn
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod

---

## 📱 Pages & Routes

### Public
- `/` - Homepage with features showcase
- `/auth/login` - User login
- `/auth/register` - User registration

### Landlord Portal (`/landlord/*`)
- `/landlord/dashboard` - Overview and stats
- `/landlord/properties` - Property management
- `/landlord/properties/new` - Add new property
- `/landlord/applications` - Review applications
- `/landlord/tenants` - Manage tenants
- `/landlord/payments` - Payment tracking
- `/landlord/messages` - Communications
- `/landlord/settings` - Account settings

### Tenant Portal (`/tenant/*`)
- `/tenant/dashboard` - Overview and stats
- `/tenant/properties` - Browse properties
- `/tenant/properties/[id]` - Property details
- `/tenant/applications` - My applications
- `/tenant/favorites` - Saved properties
- `/tenant/payments` - Payment history
- `/tenant/messages` - Communications
- `/tenant/settings` - Account settings

---

## 🎯 Key Workflows

### Property Listing Flow (Landlord)
1. Navigate to "Add Property"
2. Select province, city, and location from dropdowns
3. Fill in property details (type, rent, amenities)
4. Upload property photos
5. Publish listing

### Application Flow (Tenant)
1. Browse properties or search by location
2. View property details
3. Submit application with employment info
4. Request viewing appointment
5. Track application status
6. Receive approval/rejection

### Viewing Request Flow
1. Tenant requests viewing with preferred date/time
2. Landlord receives notification
3. Landlord confirms or suggests alternative
4. Both parties receive confirmation
5. Viewing marked as completed

---

## 🚀 Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Other Platforms
The app works on any platform supporting Next.js:
- Netlify
- Railway
- Render
- Self-hosted

---

## 📝 Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_APP_URL=your_app_url
```

---

## 🤝 Support

For issues or questions:
1. Check the documentation above
2. Review Supabase dashboard for database errors
3. Check browser console for frontend errors
4. Verify all database scripts were run successfully

---

## 📄 License

Proprietary - MyYard Platform

---

## 🎨 Branding

**Logo**: `/public/myyard-logo.svg`
**Tagline**: "Where Community Finds Home"
**Colors**:
- Primary: Emerald 600 (#059669)
- Secondary: Teal 600 (#0d9488)
- Accent: Orange 600 (#ea580c)

**Typography**:
- Headings: Bold, Black weights
- Body: Inter, Segoe UI, system fonts

---

## 🔄 Development Roadmap

### Phase 1 (Current)
- ✅ User authentication
- ✅ Property listings
- ✅ Application system
- ✅ Location filtering
- ✅ Basic messaging

### Phase 2 (Future)
- [ ] Payment gateway integration
- [ ] Advanced search filters
- [ ] Property verification system
- [ ] Mobile app (React Native)
- [ ] Push notifications
- [ ] SMS notifications
- [ ] Advanced analytics

---

**Built with ❤️ for South African Communities**
