import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserResponse } from '@shared/routes';
import { api } from '@shared/routes';

interface AuthState {
  user: UserResponse | null;
  token: string | null;
  isLoading: boolean;
  setAuth: (user: UserResponse, token: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  rehydrateAuth: () => Promise<void>;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      setAuth: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
      isAuthenticated: () => !!get().token,
      rehydrateAuth: async () => {
        const token = get().token;
        if (!token) return;
        
        set({ isLoading: true });
        try {
          const res = await fetch(api.auth.me.path, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const user = await res.json();
            set({ user, isLoading: false });
          } else {
            set({ user: null, token: null, isLoading: false });
          }
        } catch {
          set({ user: null, token: null, isLoading: false });
        }
      },
    }),
    {
      name: 'serenlio-auth',
    }
  )
);

export function getAuthHeader(): HeadersInit {
  const token = useAuth.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}
