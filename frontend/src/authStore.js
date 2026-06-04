// src/authStore.js
import { create } from "zustand";
import { BACKEND_URL } from "./config";

export const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: localStorage.getItem("access_token") || null,
  isAuthChecked: false,

  setUser: (user) => set({ user }),

  setAccessToken: (token) => {
    if (token) {
      localStorage.setItem("access_token", token);
    } else {
      localStorage.removeItem("access_token");
    }
    set({ accessToken: token });
  },

  logout: async () => {
    try {
      await fetch(`${BACKEND_URL}/api/auth/logout/`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      localStorage.removeItem("access_token");
      set({ user: null, accessToken: null, isAuthChecked: true });
    }
  },

  refreshAccessToken: async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/refresh/`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) throw new Error("Refresh failed");

      const data = await res.json();

      if (data.access) {
        get().setAccessToken(data.access);
        return data.access;
      }

      throw new Error("No access token received");
    } catch (err) {
      console.warn("Token refresh failed:", err);
      await get().logout();
      return null;
    }
  },

  initializeAuth: async () => {
    try {
      let token = get().accessToken;

      if (!token) {
        token = await get().refreshAccessToken();
      }

      if (token) {
        await get().refreshUser();
      }
    } catch (err) {
      console.error("initializeAuth error:", err);
    } finally {
      set({ isAuthChecked: true });
    }
  },
refreshUser: async (projectSlug = null) => {
  try {
    const token = get().accessToken;

    const url = new URL(`${BACKEND_URL}/api/auth/me/`);
    if (projectSlug) {
      url.searchParams.append("project_slug", projectSlug);
    }

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error("Failed to fetch user");

    const user = await res.json();
    set({ user });

  } catch (err) {
    console.error("refreshUser failed:", err);
  }
},


}));
