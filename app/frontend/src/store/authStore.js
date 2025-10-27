import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";

export const useAuthStore = create(
  devtools((set) => ({
    user: null,
    token: null,
    initialized: false,

    init: () => {
      const auth = getAuth();
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          const token = await user.getIdToken();
          set({ user, token, initialized: true });
        } else {
          set({ user: null, token: null, initialized: true });
        }
      });
    },

    logout: async () => {
      const auth = getAuth();
      await signOut(auth);
      set({ user: null, token: null });
    },
  }))
);