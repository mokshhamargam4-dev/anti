import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Profile, UserRole, DementiaStage } from '../types/database';

export interface SignUpData {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  region?: string;
  primaryLanguage?: string;
  dementiaStage?: DementiaStage;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  role: UserRole | null;
  loading: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (data: SignUpData) => Promise<{ error: Error | null; user?: User | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isConfigured] = useState<boolean>(isSupabaseConfigured());

  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.warn('Error fetching user profile:', error.message);
        return null;
      }
      return data as Profile;
    } catch (err) {
      console.error('Unexpected error fetching profile:', err);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const p = await fetchProfile(user.id);
      if (p) setProfile(p);
    }
  };

  useEffect(() => {
    if (!isConfigured) {
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        const p = await fetchProfile(session.user.id);
        setProfile(p);
      }
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        const p = await fetchProfile(session.user.id);
        setProfile(p);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isConfigured]);

  const signIn = async (email: string, password: string): Promise<{ error: Error | null }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) return { error };

      if (data.user) {
        setUser(data.user);
        const p = await fetchProfile(data.user.id);
        setProfile(p);
      }

      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signUp = async (data: SignUpData): Promise<{ error: Error | null; user?: User | null }> => {
    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            role: data.role,
            region: data.region || 'Assam',
            primary_language: data.primaryLanguage || 'Assamese',
            dementia_stage: data.dementiaStage || (data.role === 'elderly' ? 'mild' : 'not_applicable'),
          },
        },
      });

      if (signUpError) return { error: signUpError };

      if (authData.user) {
        setUser(authData.user);
        // Explicit profile creation in case trigger didn't run or email confirmation is enabled
        const { error: profileError } = await supabase.from('profiles').upsert({
          id: authData.user.id,
          role: data.role,
          full_name: data.fullName,
          preferred_name: data.fullName,
          region: data.region || 'Assam',
          primary_language: data.primaryLanguage || 'Assamese',
          dementia_stage: data.dementiaStage || (data.role === 'elderly' ? 'mild' : 'not_applicable'),
        });

        if (profileError) {
          console.warn('Upsert profile notice:', profileError.message);
        }

        const p = await fetchProfile(authData.user.id);
        setProfile(p);
      }

      return { error: null, user: authData.user };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setSession(null);
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  const role = profile?.role ?? (user?.user_metadata?.role as UserRole | undefined) ?? null;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        role,
        loading,
        isConfigured,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
