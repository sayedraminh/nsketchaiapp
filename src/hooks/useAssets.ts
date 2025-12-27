import { useEffect, useCallback, useMemo, useRef, useState } from "react";
import { AppState, AppStateStatus } from "react-native";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
import { useQuery, useMutation, useConvex } from "convex/react";
import { useAuth } from "@clerk/clerk-expo";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import useAssetsCacheStore, { CachedAssetItem, CachedFavorite } from "../state/assetsCacheStore";
import useAssetsQueueStore, { PendingAssetAction } from "../state/assetsQueueStore";
import { useNetworkStatus } from "../lib/network";
import { useFavorites, makeFavoriteKey } from "./useFavorites";

// Keep this in sync with web AssetsView - session types that contain assets
const ASSET_SESSION_TYPES = ["image", "video", "edit", "assets"];
// Initial batch size for faster first load, then load more on scroll
const INITIAL_SESSIONS_TO_LOAD = 10;
const SESSIONS_PER_PAGE = 10;

export interface AssetItem {
  id: string;
  generationId: string;
  sessionId: string;
  mediaType: "image" | "video";
  index: number;
  url: string;
  previewUrl?: string;
  prompt?: string;
  createdAt?: number;
  isEnhanced?: boolean;
  isFavorite: boolean;
  isPendingDelete?: boolean;
  aspectRatio?: string;
}

interface UseAssetsReturn {
  assets: AssetItem[];
  favorites: CachedFavorite[];
  isLoading: boolean;
  isLoadingMore: boolean;
  isOffline: boolean;
  hasPendingActions: boolean;
  assetsSessionId: string | null;
  hasMore: boolean;
  
  // Actions
  deleteAsset: (generationId: string, mediaType: "image" | "video", mediaIndex: number) => Promise<void>;
  toggleFavorite: (generationId: string, mediaType: "image" | "video", mediaIndex: number) => Promise<void>;
  refreshAssets: () => void;
  loadMore: () => void;
}

export function useAssets(): UseAssetsReturn {
  const { isSignedIn, userId } = useAuth();
  const { isConnected, isInternetReachable } = useNetworkStatus();
  const isOnline = isConnected && isInternetReachable !== false;
  const isSyncing = useRef(false);
  const convex = useConvex();

  // Local state for generations cache
  const [generationsCache, setGenerationsCache] = useState<Record<string, any[]>>({});
  const [isLoadingGenerations, setIsLoadingGenerations] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [sessionsLimit, setSessionsLimit] = useState(INITIAL_SESSIONS_TO_LOAD);
  const loadedSessionsRef = useRef<Set<string>>(new Set());

  // Get all sessions for the current user
  const sessions = useQuery(api.sessions.getUserSessions);

  // All asset sessions (unsliced) for pagination tracking
  const allAssetSessions = useMemo(() => {
    if (!sessions) return [];
    return sessions.filter((s: any) => ASSET_SESSION_TYPES.includes(s.type));
  }, [sessions]);

  // Filter to asset session types and take current limit
  const assetSessions = useMemo(() => {
    return allAssetSessions.slice(0, sessionsLimit);
  }, [allAssetSessions, sessionsLimit]);

  // Check if there are more sessions to load
  const hasMore = allAssetSessions.length > sessionsLimit;

  // Find the main "All Assets" session for the return value
  const mainAssetsSession = useMemo(() => {
    if (!sessions) return null;
    return sessions.find(
      (s: any) => s.type === "assets" && s.title === "All Assets"
    ) || sessions.find((s: any) => s.type === "assets") || null;
  }, [sessions]);

  // Fetch ALL sessions' generations in parallel (not batched)
  const fetchGenerationsForSessions = useCallback(async (sessionIds: string[]) => {
    if (sessionIds.length === 0) return;
    
    setIsLoadingGenerations(true);
    
    // Fetch ALL sessions in parallel for speed
    const results = await Promise.all(
      sessionIds.map(async (sessionId) => {
        try {
          const generations = await convex.query(
            api.sessions.getSessionGenerations,
            { sessionId: sessionId as Id<"sessions"> }
          );
          return { sessionId, generations: generations || [] };
        } catch (error) {
          console.error(`Failed to fetch generations for session ${sessionId}:`, error);
          return { sessionId, generations: [] };
        }
      })
    );
    
    // Update cache with all results
    const newCache: Record<string, any[]> = { ...generationsCache };
    results.forEach(({ sessionId, generations }) => {
      newCache[sessionId] = generations;
      loadedSessionsRef.current.add(sessionId);
    });
    
    setGenerationsCache(newCache);
    setIsLoadingGenerations(false);
  }, [convex, generationsCache]);

  // Load generations when sessions change
  useEffect(() => {
    if (!assetSessions.length || !isOnline) return;
    
    // Find sessions that haven't been loaded yet
    const unloadedSessionIds = assetSessions
      .map((s: any) => s._id as string)
      .filter((id) => !loadedSessionsRef.current.has(id));
    
    if (unloadedSessionIds.length > 0) {
      fetchGenerationsForSessions(unloadedSessionIds);
    }
  }, [assetSessions, isOnline, fetchGenerationsForSessions]);

  // Use the shared favorites hook for optimistic updates
  const {
    favoriteSet,
    isFavorited,
    toggleFavorite: toggleFavoriteAction,
    favorites: convexFavorites,
  } = useFavorites();

  // Convex mutations
  const deleteAssetMediaMutation = useMutation(api.sessions.deleteAssetMedia);
  const toggleFavoriteMutation = useMutation(api.sessions.toggleFavorite);

  // Cache store
  const {
    assets: cachedAssets,
    favorites: cachedFavorites,
    assetsSessionId: cachedAssetsSessionId,
    setUserId,
    setAssetsSessionId,
    setAssets,
    setFavorites,
    removeAsset,
    toggleAssetFavorite,
    clearCache,
  } = useAssetsCacheStore();

  // Queue store
  const {
    pendingActions,
    addPendingAction,
    markAsSyncing,
    markAsSynced,
    markAsFailed,
    removePendingAction,
    getPendingToSync,
    hasPendingAction,
    clearAllForUser,
    clearSyncedActions,
  } = useAssetsQueueStore();

  // Set user ID when auth changes
  useEffect(() => {
    if (userId) {
      setUserId(userId);
    }
  }, [userId, setUserId]);

  // Clear data on sign out
  useEffect(() => {
    if (!isSignedIn) {
      clearAllForUser();
      clearCache();
    }
  }, [isSignedIn, clearAllForUser, clearCache]);

  // Update cached assets session ID
  useEffect(() => {
    if (mainAssetsSession?._id) {
      setAssetsSessionId(mainAssetsSession._id);
    }
  }, [mainAssetsSession, setAssetsSessionId]);

  // Flatten ALL sessions' generations into asset items
  const serverAssets = useMemo(() => {
    const hasGenerations = Object.keys(generationsCache).length > 0;
    if (!hasGenerations) return null;

    const items: CachedAssetItem[] = [];

    assetSessions.forEach((session: any) => {
      const sessionGenerations = generationsCache[session._id] || [];
      
      sessionGenerations.forEach((gen: any) => {
        // Add images
        if (gen.images && Array.isArray(gen.images)) {
          gen.images.forEach((img: any, index: number) => {
            const url = typeof img === "string" ? img : img.url;
            const displayUrl = index === 0 && gen.previewImage ? gen.previewImage : url;
            if (url) {
              const favoriteKey = makeFavoriteKey(gen._id, "image", index);
              items.push({
                id: `${gen._id}:image:${index}`,
                generationId: gen._id,
                sessionId: session._id,
                mediaType: "image",
                index,
                url,
                previewUrl: displayUrl,
                prompt: gen.prompt,
                createdAt: gen.completedAt || gen._creationTime,
                isEnhanced: session.type === "edit",
                isFavorite: favoriteSet.has(favoriteKey),
                aspectRatio: gen.aspectRatio,
              });
            }
          });
        }

        // Add videos
        if (gen.videos && Array.isArray(gen.videos)) {
          gen.videos.forEach((videoUrl: string, index: number) => {
            const favoriteKey = makeFavoriteKey(gen._id, "video", index);
            items.push({
              id: `${gen._id}:video:${index}`,
              generationId: gen._id,
              sessionId: session._id,
              mediaType: "video",
              index,
              url: videoUrl,
              previewUrl: gen.previewImage || undefined,
              prompt: gen.prompt,
              createdAt: gen.completedAt || gen._creationTime,
              isEnhanced: false,
              isFavorite: favoriteSet.has(favoriteKey),
              aspectRatio: gen.aspectRatio,
            });
          });
        }
      });
    });

    // Sort by creation time, newest first
    items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    return items;
  }, [assetSessions, generationsCache, favoriteSet]);

  // Update cache when server data changes
  useEffect(() => {
    if (serverAssets && isOnline) {
      setAssets(serverAssets);
      
      // Update favorites cache
      if (convexFavorites) {
        const favorites: CachedFavorite[] = convexFavorites.map((f: any) => ({
          generationId: f.generationId,
          mediaType: f.mediaType,
          mediaIndex: f.mediaIndex,
        }));
        setFavorites(favorites);
      }
    }
  }, [serverAssets, convexFavorites, isOnline, setAssets, setFavorites]);

  // Sync pending actions when back online
  const syncPendingActions = useCallback(async () => {
    if (isSyncing.current || !isSignedIn || !isOnline) return;

    const pendingItems = getPendingToSync();
    if (pendingItems.length === 0) return;

    isSyncing.current = true;

    for (const action of pendingItems) {
      try {
        markAsSyncing(action.id);

        if (action.type === "deleteAsset") {
          await deleteAssetMediaMutation({
            generationId: action.generationId as Id<"sessionGenerations">,
            mediaType: action.mediaType,
            mediaIndex: action.mediaIndex,
          });
        } else if (action.type === "toggleFavorite") {
          await toggleFavoriteMutation({
            generationId: action.generationId as Id<"sessionGenerations">,
            mediaType: action.mediaType,
            mediaIndex: action.mediaIndex,
          });
        }

        markAsSynced(action.id);
      } catch (error: any) {
        console.error("Failed to sync asset action:", error);
        // If "not found" error, treat as already done
        if (error?.message?.includes("not found") || error?.message?.includes("Not found")) {
          markAsSynced(action.id);
        } else {
          markAsFailed(action.id, error?.message || "Unknown error");
        }
      }
    }

    // Clean up synced actions
    clearSyncedActions();
    isSyncing.current = false;
  }, [
    isSignedIn,
    isOnline,
    getPendingToSync,
    markAsSyncing,
    markAsSynced,
    markAsFailed,
    clearSyncedActions,
    deleteAssetMediaMutation,
    toggleFavoriteMutation,
  ]);

  // Network change listener
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      if (state.isConnected && state.isInternetReachable) {
        syncPendingActions();
      }
    });

    return () => unsubscribe();
  }, [syncPendingActions]);

  // App state listener
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === "active" && isOnline) {
        syncPendingActions();
      }
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);
    return () => subscription.remove();
  }, [syncPendingActions, isOnline]);

  // Initial sync on mount
  useEffect(() => {
    if (isSignedIn && isOnline) {
      syncPendingActions();
    }
  }, [isSignedIn, isOnline, syncPendingActions]);

  // Delete asset action
  const deleteAsset = useCallback(
    async (generationId: string, mediaType: "image" | "video", mediaIndex: number) => {
      const assetId = `${generationId}-${mediaType}-${mediaIndex}`;

      if (isOnline) {
        // Online: Call mutation directly
        try {
          await deleteAssetMediaMutation({
            generationId: generationId as Id<"sessionGenerations">,
            mediaType,
            mediaIndex,
          });
        } catch (error) {
          console.error("Failed to delete asset:", error);
          throw error;
        }
      } else {
        // Offline: Queue the action and apply optimistic update
        addPendingAction({
          type: "deleteAsset",
          generationId,
          mediaType,
          mediaIndex,
        });
        
        // Optimistic update: remove from local cache
        removeAsset(assetId);
      }
    },
    [isOnline, deleteAssetMediaMutation, addPendingAction, removeAsset]
  );

  // Toggle favorite is now handled by useFavorites hook with optimistic updates
  // For offline mode, we still queue the action
  const handleToggleFavorite = useCallback(
    async (generationId: string, mediaType: "image" | "video", mediaIndex: number) => {
      if (isOnline) {
        // Online: Use the optimistic toggle from useFavorites
        await toggleFavoriteAction(generationId, mediaType, mediaIndex);
      } else {
        // Offline: Queue the action and apply optimistic update to cache
        addPendingAction({
          type: "toggleFavorite",
          generationId,
          mediaType,
          mediaIndex,
        });
        toggleAssetFavorite(generationId, mediaType, mediaIndex);
      }
    },
    [isOnline, toggleFavoriteAction, addPendingAction, toggleAssetFavorite]
  );

  // Determine which assets to display
  const displayAssets = useMemo((): AssetItem[] => {
    // If online and have server data, use that (real-time)
    if (isOnline && serverAssets) {
      // Mark assets with current favorite state from shared store
      return serverAssets.map((asset) => ({
        ...asset,
        sessionId: asset.sessionId || "",
        // Always use the shared favoriteSet for current state (includes optimistic updates)
        isFavorite: isFavorited(asset.generationId, asset.mediaType, asset.index),
        isPendingDelete: hasPendingAction(
          "deleteAsset",
          asset.generationId,
          asset.mediaType,
          asset.index
        ),
      }));
    }

    // If offline or loading, use cached data
    return cachedAssets.map((asset) => ({
      ...asset,
      sessionId: (asset as any).sessionId || "",
      isFavorite: asset.isFavorite || false,
      isPendingDelete: hasPendingAction(
        "deleteAsset",
        asset.generationId,
        asset.mediaType,
        asset.index
      ),
    }));
  }, [isOnline, serverAssets, cachedAssets, hasPendingAction, isFavorited]);

  // Filter out pending deletes for display
  const visibleAssets = useMemo(() => {
    return displayAssets.filter((asset) => !asset.isPendingDelete);
  }, [displayAssets]);

  // Determine favorites to display
  const displayFavorites = useMemo((): CachedFavorite[] => {
    if (isOnline && convexFavorites) {
      return convexFavorites.map((f) => ({
        generationId: f.generationId,
        mediaType: f.mediaType,
        mediaIndex: f.mediaIndex,
      }));
    }
    return cachedFavorites;
  }, [isOnline, convexFavorites, cachedFavorites]);

  // Loading state
  const isLoading = isOnline 
    ? sessions === undefined || isLoadingGenerations
    : false; // Never show loading when offline (use cache)

  // Refresh function (for pull-to-refresh)
  const refreshAssets = useCallback(() => {
    if (isOnline) {
      // Clear loaded sessions to force refetch
      loadedSessionsRef.current.clear();
      setGenerationsCache({});
      setSessionsLimit(INITIAL_SESSIONS_TO_LOAD);
      syncPendingActions();
    }
  }, [isOnline, syncPendingActions]);

  // Load more sessions (pagination)
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore || !isOnline) return;
    
    setIsLoadingMore(true);
    
    // Get the next batch of session IDs
    const nextSessions = allAssetSessions.slice(sessionsLimit, sessionsLimit + SESSIONS_PER_PAGE);
    const nextSessionIds = nextSessions
      .map((s: any) => s._id as string)
      .filter((id) => !loadedSessionsRef.current.has(id));
    
    if (nextSessionIds.length > 0) {
      // Fetch generations for new sessions
      const results = await Promise.all(
        nextSessionIds.map(async (sessionId) => {
          try {
            const generations = await convex.query(
              api.sessions.getSessionGenerations,
              { sessionId: sessionId as Id<"sessions"> }
            );
            return { sessionId, generations: generations || [] };
          } catch (error) {
            console.error(`Failed to fetch generations for session ${sessionId}:`, error);
            return { sessionId, generations: [] };
          }
        })
      );
      
      // Update cache with results
      const newCache: Record<string, any[]> = { ...generationsCache };
      results.forEach(({ sessionId, generations }) => {
        newCache[sessionId] = generations;
        loadedSessionsRef.current.add(sessionId);
      });
      
      setGenerationsCache(newCache);
    }
    
    // Increase the limit to show more sessions
    setSessionsLimit((prev) => prev + SESSIONS_PER_PAGE);
    setIsLoadingMore(false);
  }, [hasMore, isLoadingMore, isOnline, allAssetSessions, sessionsLimit, convex, generationsCache]);

  return {
    assets: visibleAssets,
    favorites: displayFavorites,
    isLoading,
    isLoadingMore,
    isOffline: !isOnline,
    hasPendingActions: pendingActions.length > 0,
    assetsSessionId: mainAssetsSession?._id || cachedAssetsSessionId,
    hasMore,
    deleteAsset,
    toggleFavorite: handleToggleFavorite,
    refreshAssets,
    loadMore,
  };
}

export default useAssets;
