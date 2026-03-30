'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

export type UserRole = 'student' | 'teacher' | 'admin';

export interface UserProfile {
    id: string; // Add this
    user_id: string;
    role: UserRole;
    avatar_url: string;
    full_name: string;
    email: string;
    phone: string;
    bio: string;

}

const emptyProfile: UserProfile = {
    id: '',
    user_id: '',
    role: 'student',
    avatar_url: '',
    full_name: '',
    email: '',
    phone: '',
    bio: '',
};

export function useCurrentUser() {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile>(emptyProfile);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const supabase = createClient();

        const fetchProfile = async () => {
            const { data: { user: authUser } } = await supabase.auth.getUser();

            if (!authUser) {
                setLoading(false);
                return;
            }

            setUser(authUser);

            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', authUser.id)
                .single();

            if (profileData) {
                setProfile({
                    id: profileData.id,
                    user_id: authUser.id,
                    role: profileData.role || 'student',
                    avatar_url: profileData.avatar_url || '',
                    full_name: profileData.full_name || authUser.user_metadata?.full_name || '',
                    email: profileData.email || authUser.email || '',
                    phone: profileData.phone || '',
                    bio: profileData.bio || '',
                });
            } else {
                // Fallback to auth metadata if profile doesn't exist yet
                setProfile({
                    id: authUser.id, // Use auth user id as fallback
                    user_id: authUser.id,
                    role: authUser.user_metadata?.role || 'student',
                    avatar_url: '',
                    full_name: authUser.user_metadata?.full_name || '',
                    email: authUser.email || '',
                    phone: '',
                    bio: '',
                });
            }

            setLoading(false);
        };

        fetchProfile();

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (event === 'SIGNED_OUT') {
                    setUser(null);
                    setProfile(emptyProfile);
                    setLoading(false);
                } else if (session?.user) {
                    // Re-fetch profile on sign in or token refresh
                    fetchProfile();
                }
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    // Helper to update profile locally (after a save action)
    const refreshProfile = async () => {
        const supabase = createClient();
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) return;

        const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .single();

        if (profileData) {
            setProfile({
                id: profileData.id,
                user_id: authUser.id,
                role: profileData.role || 'student',
                avatar_url: profileData.avatar_url || '',
                full_name: profileData.full_name || '',
                email: profileData.email || authUser.email || '',
                phone: profileData.phone || '',
                bio: profileData.bio || '',
            });
        }
    };

    return { user, profile, loading, refreshProfile };
}
