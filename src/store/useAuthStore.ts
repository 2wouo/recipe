import { create } from 'zustand';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  signOut: () => Promise<void>;
  checkUser: () => Promise<void>;
  uploadAvatar: (file: File) => Promise<string | null>;
  updateProfile: (updates: { avatar_url?: string; display_name?: string }) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user, loading: false }),
  signOut: async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    set({ user: null, loading: false });
    window.location.href = '/login';
  },
  checkUser: async () => {
    try {
      set({ loading: true });
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      set({ user, loading: false });
    } catch (error) {
      console.error('Check user error:', error);
      set({ user: null, loading: false });
    }
  },
  uploadAvatar: async (file) => {
    const supabase = createClient();
    const user = get().user;
    if (!user) return null;

    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Avatar upload error:', uploadError);
      return null;
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    return data.publicUrl;
  },
  updateProfile: async (updates) => {
    const supabase = createClient();
    const user = get().user;
    if (!user) return;

    // 1. Update profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (profileError) {
      console.error('Profile update error:', profileError);
      return;
    }

    // 2. Update Auth Metadata
    const { data, error: authError } = await supabase.auth.updateUser({
      data: updates
    });

    if (authError) {
      console.error('Auth metadata update error:', authError);
      return;
    }

    if (data.user) {
        set({ user: data.user });
    }
  }
}));