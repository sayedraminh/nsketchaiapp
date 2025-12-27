import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface PendingGeneration {
  localId: string;
  prompt: string;
  style?: string;
  aspectRatio?: string;
  model?: string;
  createdAt: number;
  status: "pending" | "syncing" | "synced" | "failed";
  convexId?: string;
  error?: string;
}

interface OfflineQueueState {
  pendingGenerations: PendingGeneration[];
  addPendingGeneration: (
    generation: Omit<PendingGeneration, "localId" | "createdAt" | "status">
  ) => string;
  updatePendingGeneration: (
    localId: string,
    updates: Partial<PendingGeneration>
  ) => void;
  removePendingGeneration: (localId: string) => void;
  markAsSyncing: (localId: string) => void;
  markAsSynced: (localId: string, convexId: string) => void;
  markAsFailed: (localId: string, error: string) => void;
  getPendingToSync: () => PendingGeneration[];
  clearAllForUser: () => void;
}

function generateLocalId(): string {
  return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

const useOfflineQueueStore = create<OfflineQueueState>()(
  persist(
    (set, get) => ({
      pendingGenerations: [],

      addPendingGeneration: (generation) => {
        const localId = generateLocalId();
        const newGeneration: PendingGeneration = {
          ...generation,
          localId,
          createdAt: Date.now(),
          status: "pending",
        };
        set((state) => ({
          pendingGenerations: [...state.pendingGenerations, newGeneration],
        }));
        return localId;
      },

      updatePendingGeneration: (localId, updates) => {
        set((state) => ({
          pendingGenerations: state.pendingGenerations.map((gen) =>
            gen.localId === localId ? { ...gen, ...updates } : gen
          ),
        }));
      },

      removePendingGeneration: (localId) => {
        set((state) => ({
          pendingGenerations: state.pendingGenerations.filter(
            (gen) => gen.localId !== localId
          ),
        }));
      },

      markAsSyncing: (localId) => {
        get().updatePendingGeneration(localId, { status: "syncing" });
      },

      markAsSynced: (localId, convexId) => {
        get().updatePendingGeneration(localId, {
          status: "synced",
          convexId,
        });
      },

      markAsFailed: (localId, error) => {
        get().updatePendingGeneration(localId, {
          status: "failed",
          error,
        });
      },

      getPendingToSync: () => {
        return get().pendingGenerations.filter(
          (gen) => gen.status === "pending" || gen.status === "failed"
        );
      },

      clearAllForUser: () => {
        set({ pendingGenerations: [] });
      },
    }),
    {
      name: "offline-queue-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useOfflineQueueStore;
