import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type AssetActionType = "deleteAsset" | "toggleFavorite";

export interface PendingAssetAction {
  id: string;
  type: AssetActionType;
  generationId: string;
  mediaType: "image" | "video";
  mediaIndex: number;
  createdAt: number;
  status: "pending" | "syncing" | "synced" | "failed";
  error?: string;
}

interface AssetsQueueState {
  pendingActions: PendingAssetAction[];
  
  // Actions
  addPendingAction: (
    action: Omit<PendingAssetAction, "id" | "createdAt" | "status">
  ) => string;
  updatePendingAction: (id: string, updates: Partial<PendingAssetAction>) => void;
  removePendingAction: (id: string) => void;
  markAsSyncing: (id: string) => void;
  markAsSynced: (id: string) => void;
  markAsFailed: (id: string, error: string) => void;
  getPendingToSync: () => PendingAssetAction[];
  hasPendingAction: (
    type: AssetActionType,
    generationId: string,
    mediaType: "image" | "video",
    mediaIndex: number
  ) => boolean;
  clearAllForUser: () => void;
  clearSyncedActions: () => void;
}

function generateActionId(): string {
  return `asset_action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

const useAssetsQueueStore = create<AssetsQueueState>()(
  persist(
    (set, get) => ({
      pendingActions: [],

      addPendingAction: (action) => {
        const id = generateActionId();
        const newAction: PendingAssetAction = {
          ...action,
          id,
          createdAt: Date.now(),
          status: "pending",
        };
        set((state) => ({
          pendingActions: [...state.pendingActions, newAction],
        }));
        return id;
      },

      updatePendingAction: (id, updates) => {
        set((state) => ({
          pendingActions: state.pendingActions.map((action) =>
            action.id === id ? { ...action, ...updates } : action
          ),
        }));
      },

      removePendingAction: (id) => {
        set((state) => ({
          pendingActions: state.pendingActions.filter((action) => action.id !== id),
        }));
      },

      markAsSyncing: (id) => {
        get().updatePendingAction(id, { status: "syncing" });
      },

      markAsSynced: (id) => {
        get().updatePendingAction(id, { status: "synced" });
      },

      markAsFailed: (id, error) => {
        get().updatePendingAction(id, { status: "failed", error });
      },

      getPendingToSync: () => {
        return get().pendingActions.filter(
          (action) => action.status === "pending" || action.status === "failed"
        );
      },

      hasPendingAction: (type, generationId, mediaType, mediaIndex) => {
        return get().pendingActions.some(
          (action) =>
            action.type === type &&
            action.generationId === generationId &&
            action.mediaType === mediaType &&
            action.mediaIndex === mediaIndex &&
            (action.status === "pending" || action.status === "syncing")
        );
      },

      clearAllForUser: () => {
        set({ pendingActions: [] });
      },

      clearSyncedActions: () => {
        set((state) => ({
          pendingActions: state.pendingActions.filter(
            (action) => action.status !== "synced"
          ),
        }));
      },
    }),
    {
      name: "assets-queue-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useAssetsQueueStore;
