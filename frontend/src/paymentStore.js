// src/paymentStore.js
import { create } from "zustand";

export const usePaymentStore = create((set, get) => ({
  // 🔹 Project-wise subscription cache
  subscriptions: {}, // { [projectSlug]: subscriptionData }

  // 🔹 Global loading flag (simple + enough for now)
  isCheckingSubscription: false,

  // 🔹 Refresh subscription for a specific project
  refreshProjectSubscription: async (projectSlug) => {
    if (!projectSlug) return null;

    const token = localStorage.getItem("access_token");
    if (!token) {
      console.warn("No access token found while checking subscription");
      return null;
    }

    try {
      set({ isCheckingSubscription: true });

      const res = await fetch(
        `${BACKEND_URL}/api/payments/subscription-status/${projectSlug}/`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!res.ok) {
        throw new Error(`Subscription check failed (${res.status})`);
      }

      const data = await res.json();

      // 🔹 Store subscription per project
      set((state) => ({
        subscriptions: {
          ...state.subscriptions,
          [projectSlug]: data,
        },
      }));

      return data;
    } catch (err) {
      console.error("refreshProjectSubscription failed:", err);
      return null;
    } finally {
      set({ isCheckingSubscription: false });
    }
  },

  // 🔹 Helper: get subscription for a project (sync)
  getProjectSubscription: (projectSlug) => {
    return get().subscriptions[projectSlug] || null;
  },

  // 🔹 Helper: clear subscription (optional, useful on logout / project delete)
  clearProjectSubscription: (projectSlug) => {
    set((state) => {
      const updated = { ...state.subscriptions };
      delete updated[projectSlug];
      return { subscriptions: updated };
    });
  },

  // 🔹 Clear everything (logout-safe)
  resetSubscriptions: () => {
    set({ subscriptions: {}, isCheckingSubscription: false });
  },
}));
