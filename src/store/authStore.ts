import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types";
import { tokenStore } from "@/api/tokenStore";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (access: string, refresh: string, user: User) => void;
  /** Refresh the cached user (e.g. after an admin edits their section permissions). */
  setUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (access, refresh, user) => {
        tokenStore.setAccess(access);
        localStorage.setItem("refresh-token", refresh);
        set({ user, isAuthenticated: true });
      },
      setUser: (user) => set({ user }),
      logout: () => {
        tokenStore.clear();
        localStorage.removeItem("refresh-token");
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
