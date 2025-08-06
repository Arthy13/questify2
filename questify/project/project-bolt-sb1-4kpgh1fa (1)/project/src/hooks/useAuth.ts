import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import toast from 'react-hot-toast';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSupabaseAvailable] = useState(!!supabase);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);

        if (event === 'SIGNED_IN' && session?.user) {
          // Create or update user profile
          await createOrUpdateProfile(session.user);
          toast.success('Successfully signed in!');
        } else if (event === 'SIGNED_OUT') {
          toast.success('Successfully signed out!');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const createOrUpdateProfile = async (user: User) => {
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
          avatar_url: user.user_metadata?.avatar_url,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating/updating profile:', error);
      }
    } catch (error) {
      console.error('Error in createOrUpdateProfile:', error);
    }
  };

  const signInWithGoogle = async () => {
    if (!supabase) {
      toast.error('Authentication not available');
      return { error: new Error('Supabase not configured') };
    }

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) {
        toast.error('Failed to sign in with Google');
        return { error };
      }

      return { data };
    } catch (error) {
      toast.error('An unexpected error occurred');
      return { error };
    }
  };

  const signOut = async () => {
    if (!supabase) return;

    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Error signing out');
      console.error('Error signing out:', error);
    }
  };

  const createDemoUser = (userType: 'student' | 'teacher') => {
    const demoUser = {
      id: `demo-${userType}-${Date.now()}`,
      email: `${userType}@demo.com`,
      user_metadata: {
        full_name: userType === 'student' ? 'Demo Student' : 'Demo Teacher',
        avatar_url: `https://ui-avatars.com/api/?name=${userType}&background=random`
      },
      created_at: new Date().toISOString(),
      app_metadata: {},
      aud: 'authenticated',
      role: 'authenticated'
    } as User;

    setUser(demoUser);
    toast.success(`Welcome, ${demoUser.user_metadata.full_name}!`);
    return demoUser;
  };

  return {
    user,
    loading,
    isSupabaseAvailable,
    signInWithGoogle,
    signOut,
    createDemoUser,
  };
};