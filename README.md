# SmritiSetu (স্মৃতি সেতু) — SIH PS 26003
### AI-Based Cognitive Gaming and Memory Assistance Platform for Elderly Dementia Patients in the North Eastern Region (NER)

**PART 1 — FOUNDATION**

---

## 🌟 Overview
SmritiSetu is a dedicated healthcare and reminiscence platform tailored for elderly dementia patients and their caregivers across the North Eastern Region of India (Assam, Meghalaya, Manipur, Mizoram, Nagaland, Tripura, Arunachal Pradesh, and Sikkim).

This repository contains the production-grade foundation:
1. **Frontend**: React 18 + Vite + TypeScript
2. **Styling**: Tailwind CSS with dementia-accessible typography, high touch-target sizes, and contrast controls
3. **Authentication**: Supabase Auth (Email & Password) with role-based segregation (`elderly` vs. `caregiver`)
4. **Protected Routing**: React Router v6 enforcing role boundaries
5. **Database**: PostgreSQL with Row Level Security (RLS) policies, indexes, and automated triggers
6. **Analytics Visualization**: Recharts for cognitive performance and daily engagement monitoring

---

## 📁 Project Structure

```
anti/
├── .env                         # Environment variables (Supabase URL & Key)
├── .env.example                 # Example template for environment configuration
├── index.html                   # Entry HTML with accessible fonts
├── package.json                 # Project scripts and dependencies
├── postcss.config.js            # PostCSS configuration
├── tailwind.config.js           # Custom elderly/caregiver accessible theme
├── tsconfig.json                # TypeScript compiler config
├── tsconfig.node.json           # TypeScript config for Vite
├── vite.config.ts               # Vite bundler configuration
│
├── supabase/
│   ├── schema.sql               # Complete PostgreSQL DDL (7 tables, RLS, triggers, indexes)
│   └── seed.sql                 # Sample test routines and reminiscence items
│
└── src/
    ├── App.tsx                  # Main app layout with Navbar & Footer
    ├── main.tsx                 # React DOM mount point
    ├── index.css                # Tailwind directives & accessibility CSS
    │
    ├── components/
    │   └── common/
    │       ├── Navbar.tsx       # Accessible top bar with font scaler & contrast mode
    │       └── AlertBanner.tsx  # Accessible feedback banner
    │
    ├── context/
    │   ├── AuthContext.tsx      # Supabase user session & profile state
    │   └── AccessibilityContext.tsx # Dynamic font size (A/A+/A++) & contrast mode
    │
    ├── lib/
    │   └── supabase.ts          # Resilient Supabase client & connection validator
    │
    ├── pages/
    │   ├── auth/
    │   │   ├── Login.tsx        # Email/password login with role redirect
    │   │   └── Register.tsx     # Role registration (Elderly vs Caregiver) with NER fields
    │   ├── elderly/
    │   │   └── ElderlyDashboard.tsx # Dementia-friendly patient shell
    │   ├── caregiver/
    │   │   └── CaregiverDashboard.tsx # Supervision portal with Recharts
    │   └── unauthorized/
    │       └── Unauthorized.tsx # Role mismatch guard page
    │
    ├── routes/
    │   ├── AppRoutes.tsx        # Route definitions
    │   └── ProtectedRoute.tsx   # Role-based route guard
    │
    └── types/
        └── database.ts          # Strict TypeScript interfaces matching 7 DB tables
```

---

## 🗄️ Supabase Database Architecture

The foundation includes 7 relational tables defined in `supabase/schema.sql`:

| Table | Purpose |
| :--- | :--- |
| `profiles` | User profiles with role (`elderly` / `caregiver`), NER region, primary language, dementia stage. |
| `caregiver_links` | Secure linkage between caregivers and elderly patients with active status checking. |
| `game_sessions` | Cognitive performance metrics, duration, scores, and reaction times. |
| `mood_checkins` | 1–5 mood tracking, energy level, and emotional stability logs. |
| `daily_plans` | Scheduled care routines (medications, cognitive games, family calls, walks). |
| `memory_items` | Digital reminiscence bank (NER cultural heritage: Bihu, Majuli, Loktak, photos, stories). |
| `engagement_snapshots` | Aggregated daily active time, cognitive trend averages, and early decline alerts. |

### Security & Row Level Security (RLS)
- **RLS is enabled on every table**.
- Elderly patients can **only** read and manage their own records.
- Caregivers can **only** read and manage data for elderly patients with an active link in `caregiver_links`.
- Helper function `public.is_caregiver_for(target_elderly_id)` enforces cross-account delegation securely in PostgreSQL.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Supabase Credentials
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Open `.env` and provide your real project credentials from your Supabase Dashboard (**Project Settings -> API**):
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

### 3. Apply the Database Schema
1. Open your [Supabase Project Dashboard](https://supabase.com/dashboard).
2. Go to the **SQL Editor** on the left menu.
3. Click **New Query**.
4. Copy the entire contents of [`supabase/schema.sql`](supabase/schema.sql) and paste it into the editor.
5. Click **Run**. All 7 tables, indexes, triggers, and RLS policies will be created.

### 4. Run the Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:5173`.
