// /store/authStore.js
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { getAuth, onAuthStateChanged } from "firebase/auth";

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

    signOut: async () => {
      const auth = getAuth();
      await auth.signOut();
      set({ user: null, token: null });
    },
  }))
);