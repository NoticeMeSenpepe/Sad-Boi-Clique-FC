// ============================================================
// Auth helpers — thin wrapper around Supabase Auth that:
//   • exposes the current user + their profile row as React state,
//   • subscribes to onAuthStateChange so every UI component
//     refreshes when the user signs in / out / their profile updates,
//   • implements sign-up with an invite code (the schema's trigger
//     will reject sign-up if the code is missing / invalid / used).
// ============================================================

import React from 'react';
import type { User } from '@supabase/supabase-js';
import { getSupabase } from './supabase';

export interface UserProfile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  is_admin: boolean;
  tweaks: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface AuthApi {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, displayName: string, inviteCode: string) =>
    Promise<{ error: string | null; needsEmailConfirmation: boolean }>;
  signOut: () => Promise<void>;
  updateDisplayName: (name: string) => Promise<{ error: string | null }>;
  saveTweaks: (tweaks: Record<string, unknown>) => Promise<void>;
  validateInviteCode: (code: string) => Promise<boolean>;
  reloadProfile: () => Promise<void>;
}

/**
 * useAuth — drop-in hook returning the current auth state and a small set
 * of action functions. Loosely typed (`UserProfile['tweaks']: Record<…>`)
 * because the schema's `tweaks` JSONB column is intentionally flexible.
 */
export function useAuth(): AuthApi {
  const sb = getSupabase();
  const [user, setUser]       = React.useState<User | null>(null);
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [loading, setLoading] = React.useState(true);

  // Latest user is captured in a ref so action functions don't need to
  // re-create when state changes.
  const userRef = React.useRef<User | null>(null);
  userRef.current = user;

  const loadProfile = React.useCallback(async (forUser: User | null): Promise<UserProfile | null> => {
    if (!sb || !forUser) return null;
    const { data, error } = await sb
      .from('profiles')
      .select('id, display_name, avatar_url, is_admin, tweaks, created_at, updated_at')
      .eq('id', forUser.id)
      .maybeSingle();
    if (error || !data) return null;
    return data as UserProfile;
  }, [sb]);

  // Initial session + subscription to auth changes.
  React.useEffect(() => {
    if (!sb) { setLoading(false); return; }

    let cancelled = false;

    sb.auth.getSession().then(async ({ data }) => {
      if (cancelled) return;
      const u = data.session?.user ?? null;
      setUser(u);
      const p = await loadProfile(u);
      if (cancelled) return;
      setProfile(p);
      setLoading(false);
    });

    const { data: { subscription } } = sb.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      const p = await loadProfile(u);
      setProfile(p);
    });

    return () => { cancelled = true; subscription.unsubscribe(); };
  }, [sb, loadProfile]);

  const reloadProfile = React.useCallback(async () => {
    const p = await loadProfile(userRef.current);
    setProfile(p);
  }, [loadProfile]);

  // ── Actions ────────────────────────────────────────────────────────
  const signIn: AuthApi['signIn'] = async (email, password) => {
    if (!sb) return { error: 'Sign-in unavailable (no backend connection).' };
    const { error } = await sb.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUp: AuthApi['signUp'] = async (email, password, displayName, inviteCode) => {
    if (!sb) return { error: 'Sign-up unavailable (no backend connection).', needsEmailConfirmation: false };
    const { data, error } = await sb.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName.trim(),
          invite_code:  inviteCode.trim(),
        },
        emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
      },
    });
    if (error) return { error: friendlyAuthError(error.message), needsEmailConfirmation: false };
    // Supabase: if email confirmation is on, `data.session` is null until
    // the user clicks the email link. We use that to pick the next message.
    const needsConfirm = !data.session;
    return { error: null, needsEmailConfirmation: needsConfirm };
  };

  const signOut: AuthApi['signOut'] = async () => {
    if (!sb) return;
    await sb.auth.signOut();
  };

  const updateDisplayName: AuthApi['updateDisplayName'] = async (name) => {
    if (!sb || !userRef.current) return { error: 'You must be signed in.' };
    const trimmed = name.trim();
    if (trimmed.length < 1) return { error: 'Display name cannot be empty.' };
    const { error } = await sb.from('profiles').update({ display_name: trimmed }).eq('id', userRef.current.id);
    if (error) return { error: error.message };
    await reloadProfile();
    return { error: null };
  };

  const saveTweaks: AuthApi['saveTweaks'] = async (tweaks) => {
    if (!sb || !userRef.current) return;
    await sb.from('profiles').update({ tweaks }).eq('id', userRef.current.id);
  };

  const validateInviteCode: AuthApi['validateInviteCode'] = async (code) => {
    if (!sb) return false;
    const trimmed = code.trim();
    if (trimmed.length < 1) return false;
    const { data, error } = await sb.rpc('is_invite_code_valid', { code_input: trimmed });
    if (error) return false;
    return Boolean(data);
  };

  return {
    user, profile, loading,
    signIn, signUp, signOut,
    updateDisplayName, saveTweaks, validateInviteCode, reloadProfile,
  };
}

/** Translate a few Supabase auth error messages into plainer English. */
function friendlyAuthError(raw: string): string {
  const m = raw.toLowerCase();
  if (m.includes('invalid or already-used invite code')) return 'That invite code is invalid or has already been used.';
  if (m.includes('invite code is required'))             return 'You need an invite code to sign up.';
  if (m.includes('display name is required'))            return 'Please pick a display name.';
  if (m.includes('user already registered'))             return 'An account with this email already exists.';
  if (m.includes('password should be at least'))         return 'Password is too short — use at least 6 characters.';
  if (m.includes('invalid login credentials'))           return 'Wrong email or password.';
  if (m.includes('email not confirmed'))                 return 'Please click the confirmation link in your email before signing in.';
  return raw;
}
