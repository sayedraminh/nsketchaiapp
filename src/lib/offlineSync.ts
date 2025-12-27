import { useEffect, useRef, useCallback } from "react";
import { AppState, AppStateStatus } from "react-native";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
import { useAuth } from "@clerk/clerk-expo";
import useOfflineQueueStore, {
  PendingGeneration,
} from "../state/offlineQueueStore";
import useGenerationsCacheStore from "../state/generationsCache";

interface SyncCallbacks {
  onSyncGeneration: (
    generation: PendingGeneration
  ) => Promise<{ id: string } | null>;
}

export function useOfflineSync(callbacks: SyncCallbacks) {
  const { isSignedIn, userId } = useAuth();
  const {
    getPendingToSync,
    markAsSyncing,
    markAsSynced,
    markAsFailed,
    clearAllForUser,
  } = useOfflineQueueStore();
  const { setUserId, clearCache } = useGenerationsCacheStore();
  const isSyncing = useRef(false);

  const syncPendingGenerations = useCallback(async () => {
    if (isSyncing.current || !isSignedIn) return;

    const pendingItems = getPendingToSync();
    if (pendingItems.length === 0) return;

    isSyncing.current = true;

    for (const item of pendingItems) {
      try {
        markAsSyncing(item.localId);
        const result = await callbacks.onSyncGeneration(item);
        if (result?.id) {
          markAsSynced(item.localId, result.id);
        } else {
          markAsFailed(item.localId, "No ID returned from server");
        }
      } catch (error: any) {
        console.error("Failed to sync generation:", error);
        markAsFailed(item.localId, error?.message || "Unknown error");
      }
    }

    isSyncing.current = false;
  }, [
    isSignedIn,
    getPendingToSync,
    markAsSyncing,
    markAsSynced,
    markAsFailed,
    callbacks,
  ]);

  useEffect(() => {
    if (userId) {
      setUserId(userId);
    }
  }, [userId, setUserId]);

  useEffect(() => {
    if (!isSignedIn) {
      clearAllForUser();
      clearCache();
    }
  }, [isSignedIn, clearAllForUser, clearCache]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      if (state.isConnected && state.isInternetReachable) {
        syncPendingGenerations();
      }
    });

    return () => unsubscribe();
  }, [syncPendingGenerations]);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === "active") {
        syncPendingGenerations();
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    return () => subscription.remove();
  }, [syncPendingGenerations]);

  useEffect(() => {
    if (isSignedIn) {
      syncPendingGenerations();
    }
  }, [isSignedIn, syncPendingGenerations]);

  return {
    syncPendingGenerations,
    isSyncing: isSyncing.current,
  };
}
