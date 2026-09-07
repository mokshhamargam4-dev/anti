CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ====================================================================
-- 2. CORE TABLES
-- ====================================================================

-- TABLE 1: PROFILES
-- Stores user accounts with role separation (elderly vs caregiver) and regional NER attributes
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('elderly', 'caregiver')),
    full_name TEXT NOT NULL,
    preferred_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    region TEXT DEFAULT 'Assam', -- NER States: Assam, Meghalaya, Manipur, Mizoram, Nagaland, Tripura, Arunachal Pradesh, Sikkim
    primary_language TEXT DEFAULT 'Assamese', -- Assamese, Bengali, Bodo, English, Hindi, Manipuri, Khasi, Garo, Mizo, etc.
    dementia_stage TEXT DEFAULT 'mild' CHECK (dementia_stage IN ('mild', 'moderate', 'severe', 'not_applicable')),
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- TABLE 2: CAREGIVER_LINKS
-- Links caregivers to specific elderly patients with status control
CREATE TABLE IF NOT EXISTS public.caregiver_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    caregiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    elderly_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    relationship TEXT NOT NULL DEFAULT 'Family', -- Son, Daughter, Spouse, Guardian, Clinical Caregiver
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'revoked')),
    permissions JSONB DEFAULT '{"view_metrics": true, "manage_daily_plan": true, "manage_memories": true}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_caregiver_elderly UNIQUE (caregiver_id, elderly_id),
    CONSTRAINT prevent_self_linking CHECK (caregiver_id <> elderly_id)
);

-- TABLE 3: GAME_SESSIONS
-- Records cognitive training games, scores, durations, and metrics
CREATE TABLE IF NOT EXISTS public.game_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    elderly_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    game_type TEXT NOT NULL, -- 'memory_match', 'pattern_recall', 'ner_cultural_quiz', 'audio_recollection'
    difficulty_level TEXT NOT NULL DEFAULT 'easy' CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
    score INTEGER NOT NULL DEFAULT 0,
    max_score INTEGER DEFAULT 100,
    duration_seconds INTEGER DEFAULT 0,
    accuracy_rate NUMERIC(5,2) DEFAULT 0.0,
    metrics JSONB DEFAULT '{}'::jsonb, -- reaction times, hesitation intervals, hints taken
    completed_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- TABLE 4: MOOD_CHECKINS
-- Tracks emotional stability and daily wellbeing
CREATE TABLE IF NOT EXISTS public.mood_checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    elderly_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    mood_score INTEGER NOT NULL CHECK (mood_score BETWEEN 1 AND 5), -- 1: Distressed, 2: Confused, 3: Neutral, 4: Calm, 5: Happy
    energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 5),
    dominant_emotion TEXT DEFAULT 'neutral' CHECK (dominant_emotion IN ('happy', 'calm', 'neutral', 'confused', 'sad', 'agitated')),
    notes TEXT,
    recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    checkin_time TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- TABLE 5: DAILY_PLANS
-- Daily structured routine tasks (medications, games, walks, family calls)
CREATE TABLE IF NOT EXISTS public.daily_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    elderly_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    plan_date DATE NOT NULL DEFAULT CURRENT_DATE,
    scheduled_time TIME,
    activity_type TEXT NOT NULL DEFAULT 'routine' CHECK (activity_type IN ('medication', 'cognitive_game', 'walk', 'meal', 'family_call', 'cultural_music', 'routine')),
    is_completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMPTZ,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- TABLE 6: MEMORY_ITEMS
-- Cultural & personal memory bank items for reminiscence therapy
CREATE TABLE IF NOT EXISTS public.memory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    elderly_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    item_type TEXT NOT NULL CHECK (item_type IN ('person', 'place', 'event', 'song_rhyme', 'cultural_artifact')),
    media_url TEXT,
    cultural_tag TEXT, -- e.g. 'Bihu Dance', 'Majuli River Island', 'Loktak Phumdi', 'Hornbill Festival', 'Assam Tea Garden'
    familiarity_rating INTEGER DEFAULT 5 CHECK (familiarity_rating BETWEEN 1 AND 5),
    prompts JSONB DEFAULT '[]'::jsonb, -- reminiscence conversational prompts
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- TABLE 7: ENGAGEMENT_SNAPSHOTS
-- Aggregated daily snapshots for caregiver analytics and early decline alerts
CREATE TABLE IF NOT EXISTS public.engagement_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    elderly_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_active_minutes INTEGER NOT NULL DEFAULT 0,
    games_played_count INTEGER NOT NULL DEFAULT 0,
    avg_cognitive_score NUMERIC(5,2) DEFAULT 0.0,
    dominant_mood TEXT DEFAULT 'neutral',
    memory_interaction_count INTEGER DEFAULT 0,
    alert_flag BOOLEAN DEFAULT false,
    alert_reason TEXT,
    summary_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_elderly_snapshot_date UNIQUE (elderly_id, snapshot_date)
);

-- ====================================================================
-- 3. PERFORMANCE INDEXES
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_caregiver_links_caregiver ON public.caregiver_links(caregiver_id);
CREATE INDEX IF NOT EXISTS idx_caregiver_links_elderly ON public.caregiver_links(elderly_id);
CREATE INDEX IF NOT EXISTS idx_caregiver_links_status ON public.caregiver_links(status);

CREATE INDEX IF NOT EXISTS idx_game_sessions_elderly_date ON public.game_sessions(elderly_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mood_checkins_elderly_date ON public.mood_checkins(elderly_id, checkin_time DESC);
CREATE INDEX IF NOT EXISTS idx_daily_plans_elderly_date ON public.daily_plans(elderly_id, plan_date);
CREATE INDEX IF NOT EXISTS idx_memory_items_elderly ON public.memory_items(elderly_id);
CREATE INDEX IF NOT EXISTS idx_engagement_snapshots_elderly_date ON public.engagement_snapshots(elderly_id, snapshot_date DESC);

-- ====================================================================
-- 4. UTILITY FUNCTIONS & TRIGGERS
-- ====================================================================

-- Auto-update updated_at timestamp trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_caregiver_links_updated_at ON public.caregiver_links;
CREATE TRIGGER set_caregiver_links_updated_at
    BEFORE UPDATE ON public.caregiver_links
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_daily_plans_updated_at ON public.daily_plans;
CREATE TRIGGER set_daily_plans_updated_at
    BEFORE UPDATE ON public.daily_plans
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_memory_items_updated_at ON public.memory_items;
CREATE TRIGGER set_memory_items_updated_at
    BEFORE UPDATE ON public.memory_items
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Helper function: Check if current auth user is an active caregiver for elderly_id
CREATE OR REPLACE FUNCTION public.is_caregiver_for(target_elderly_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.caregiver_links
        WHERE caregiver_id = auth.uid()
          AND elderly_id = target_elderly_id
          AND status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: Check if current auth user is linked elderly
CREATE OR REPLACE FUNCTION public.is_elderly_for(target_caregiver_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.caregiver_links
        WHERE elderly_id = auth.uid()
          AND caregiver_id = target_caregiver_id
          AND status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Automatically create a profile when a new user signs up in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_role TEXT;
    user_name TEXT;
    user_region TEXT;
    user_lang TEXT;
BEGIN
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'elderly');
    user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
    user_region := COALESCE(NEW.raw_user_meta_data->>'region', 'Assam');
    user_lang := COALESCE(NEW.raw_user_meta_data->>'primary_language', 'Assamese');

    INSERT INTO public.profiles (
        id,
        role,
        full_name,
        preferred_name,
        region,
        primary_language
    ) VALUES (
        NEW.id,
        user_role,
        user_name,
        user_name,
        user_region,
        user_lang
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ====================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caregiver_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mood_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engagement_snapshots ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------
-- A. PROFILES POLICIES
-- --------------------------------------------------------------------
-- 1. Users can view their own profile
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

-- 2. Caregivers can view profiles of their active linked elderly patients
CREATE POLICY "Caregivers can view linked elderly profiles"
    ON public.profiles FOR SELECT
    USING (public.is_caregiver_for(id));

-- 3. Elderly can view profiles of their active linked caregivers
CREATE POLICY "Elderly can view linked caregiver profiles"
    ON public.profiles FOR SELECT
    USING (public.is_elderly_for(id));

-- 4. Users can insert their own profile
CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- 5. Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- --------------------------------------------------------------------
-- B. CAREGIVER_LINKS POLICIES
-- --------------------------------------------------------------------
-- 1. Users can view links where they are either caregiver or elderly
CREATE POLICY "Users can view their caregiver links"
    ON public.caregiver_links FOR SELECT
    USING (auth.uid() = caregiver_id OR auth.uid() = elderly_id);

-- 2. Caregivers can create link invitations
CREATE POLICY "Caregivers can insert link requests"
    ON public.caregiver_links FOR INSERT
    WITH CHECK (auth.uid() = caregiver_id);

-- 3. Caregivers or elderly can update their link status
CREATE POLICY "Linked members can update link status"
    ON public.caregiver_links FOR UPDATE
    USING (auth.uid() = caregiver_id OR auth.uid() = elderly_id);

-- --------------------------------------------------------------------
-- C. GAME_SESSIONS POLICIES
-- --------------------------------------------------------------------
-- 1. Elderly can view their own game sessions
CREATE POLICY "Elderly can view own game sessions"
    ON public.game_sessions FOR SELECT
    USING (auth.uid() = elderly_id);

-- 2. Caregivers can view game sessions of linked elderly
CREATE POLICY "Caregivers can view linked elderly game sessions"
    ON public.game_sessions FOR SELECT
    USING (public.is_caregiver_for(elderly_id));

-- 3. Elderly can insert their own game sessions
CREATE POLICY "Elderly can record game sessions"
    ON public.game_sessions FOR INSERT
    WITH CHECK (auth.uid() = elderly_id);

-- --------------------------------------------------------------------
-- D. MOOD_CHECKINS POLICIES
-- --------------------------------------------------------------------
-- 1. Elderly can view their own mood checkins
CREATE POLICY "Elderly can view own mood checkins"
    ON public.mood_checkins FOR SELECT
    USING (auth.uid() = elderly_id);

-- 2. Caregivers can view mood checkins of linked elderly
CREATE POLICY "Caregivers can view linked elderly mood checkins"
    ON public.mood_checkins FOR SELECT
    USING (public.is_caregiver_for(elderly_id));

-- 3. Elderly can insert own mood checkin
CREATE POLICY "Elderly can insert own mood checkin"
    ON public.mood_checkins FOR INSERT
    WITH CHECK (auth.uid() = elderly_id);

-- 4. Caregiver can log a mood checkin on behalf of linked elderly
CREATE POLICY "Caregivers can log mood for linked elderly"
    ON public.mood_checkins FOR INSERT
    WITH CHECK (public.is_caregiver_for(elderly_id));

-- --------------------------------------------------------------------
-- E. DAILY_PLANS POLICIES
-- --------------------------------------------------------------------
-- 1. Elderly can view their daily plan
CREATE POLICY "Elderly can view own daily plans"
    ON public.daily_plans FOR SELECT
    USING (auth.uid() = elderly_id);

-- 2. Caregivers can view daily plans for linked elderly
CREATE POLICY "Caregivers can view linked elderly daily plans"
    ON public.daily_plans FOR SELECT
    USING (public.is_caregiver_for(elderly_id));

-- 3. Caregivers can create daily plans for linked elderly
CREATE POLICY "Caregivers can create daily plans"
    ON public.daily_plans FOR INSERT
    WITH CHECK (public.is_caregiver_for(elderly_id));

-- 4. Elderly can check off/complete their tasks
CREATE POLICY "Elderly can update their daily plans"
    ON public.daily_plans FOR UPDATE
    USING (auth.uid() = elderly_id);

-- 5. Caregivers can update daily plans for linked elderly
CREATE POLICY "Caregivers can update linked elderly plans"
    ON public.daily_plans FOR UPDATE
    USING (public.is_caregiver_for(elderly_id));

-- --------------------------------------------------------------------
-- F. MEMORY_ITEMS POLICIES
-- --------------------------------------------------------------------
-- 1. Elderly can view their memory items
CREATE POLICY "Elderly can view own memory items"
    ON public.memory_items FOR SELECT
    USING (auth.uid() = elderly_id);

-- 2. Caregivers can view memory items of linked elderly
CREATE POLICY "Caregivers can view linked elderly memories"
    ON public.memory_items FOR SELECT
    USING (public.is_caregiver_for(elderly_id));

-- 3. Elderly can create memory items
CREATE POLICY "Elderly can insert memory items"
    ON public.memory_items FOR INSERT
    WITH CHECK (auth.uid() = elderly_id);

-- 4. Caregivers can create memory items for linked elderly
CREATE POLICY "Caregivers can insert memories for linked elderly"
    ON public.memory_items FOR INSERT
    WITH CHECK (public.is_caregiver_for(elderly_id));

-- 5. Linked caregiver or elderly can update memory items
CREATE POLICY "Authorized users can update memory items"
    ON public.memory_items FOR UPDATE
    USING (auth.uid() = elderly_id OR public.is_caregiver_for(elderly_id));

-- --------------------------------------------------------------------
-- G. ENGAGEMENT_SNAPSHOTS POLICIES
-- --------------------------------------------------------------------
-- 1. Elderly can view their own engagement snapshots
CREATE POLICY "Elderly can view own engagement snapshots"
    ON public.engagement_snapshots FOR SELECT
    USING (auth.uid() = elderly_id);

-- 2. Caregivers can view engagement snapshots of linked elderly
CREATE POLICY "Caregivers can view linked elderly snapshots"
    ON public.engagement_snapshots FOR SELECT
    USING (public.is_caregiver_for(elderly_id));

-- 3. Caregivers can insert/update engagement snapshots for linked elderly
CREATE POLICY "Caregivers can record engagement snapshots"
    ON public.engagement_snapshots FOR INSERT
    WITH CHECK (public.is_caregiver_for(elderly_id));
