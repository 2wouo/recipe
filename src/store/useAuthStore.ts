import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  signOut: () => Promise<void>;
  checkUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user, loading: false }),
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, loading: false });
  },
  checkUser: async () => {
    try {
      set({ loading: true });
      const { data: { user } } = await supabase.auth.getUser();
      set({ user, loading: false });
    } catch (error) {
      console.error('Check user error:', error);
      set({ user: null, loading: false });
    }
  },
}));
