import { useCallback, useMemo } from "react";
import { create } from "zustand";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

type MediaType = "image" | "video";

// Key format matching web: "generationId:mediaType:index"
export const makeFavoriteKey = (
  generationId: string,
  mediaType: MediaType,
  index: number
): string => `${generationId}:${mediaType}:${index}`;

// Parse a key back to its components
export const parseFavoriteKey = (
  key: string
): { generationId: string; mediaType: MediaType; index: number } | null => {
  const parts = key.split(":");
  if (parts.length !== 3) return null;
  const [generationId, mediaType, indexStr] = parts;
  const index = parseInt(indexStr, 10);
  if (isNaN(index) || (mediaType !== "image" && mediaType !== "video")) {
    return null;
  }
  return { generationId, mediaType: mediaType as MediaType, index };
};

// Optimistic store for instant UI updates
interface FavoritesOptimisticState {
  // Map of key -> optimistic override (true = favorited, false = unfavorited)
  overrides: Record<string, boolean>;
  // Version number that increments on each change to trigger re-renders
  version: number;
  
  // Actions
  setOptimisticOverride: (key: string, isFavorite: boolean) => void;
  clearOptimisticOverride: (key: string) => void;
  clearAllOverrides: () => void;
}

export const useFavoritesOptimisticStore = create<FavoritesOptimisticState>()(
  (set) => ({
    overrides: {},
    version: 0,
    
    setOptimisticOverride: (key, isFavorite) =>
      set((state) => ({
        overrides: { ...state.overrides, [key]: isFavorite },
        version: state.version + 1,
      })),
    
    clearOptimisticOverride: (key) =>
      set((state) => {
        const newOverrides = { ...state.overrides };
        delete newOverrides[key];
        return { overrides: newOverrides, version: state.version + 1 };
      }),
    
    clearAllOverrides: () =>
      set({ overrides: {}, version: 0 }),
  })
);

interface UseFavoritesReturn {
  // Set of favorite keys for quick lookup
  favoriteSet: Set<string>;
  // Check if a specific item is favorited
  isFavorited: (generationId: string, mediaType: MediaType, index: number) => boolean;
  // Toggle favorite with optimistic update
  toggleFavorite: (generationId: string, mediaType: MediaType, index: number) => Promise<void>;
  // Raw favorites data from server
  favorites: Array<{ generationId: string; mediaType: MediaType; mediaIndex: number }>;
  // Loading state
  isLoading: boolean;
}

export function useFavorites(): UseFavoritesReturn {
  // Server data
  const convexFavorites = useQuery(api.sessions.listFavorites);
  const toggleFavoriteMutation = useMutation(api.sessions.toggleFavorite);
  
  // Optimistic store
  const { overrides, version, setOptimisticOverride, clearOptimisticOverride } =
    useFavoritesOptimisticStore();
  
  // Build the favorite set with optimistic overrides applied
  const favoriteSet = useMemo(() => {
    const set = new Set<string>();
    
    // First, add all server favorites
    if (convexFavorites) {
      for (const f of convexFavorites) {
        const key = makeFavoriteKey(f.generationId, f.mediaType, f.mediaIndex);
        set.add(key);
      }
    }
    
    // Then apply optimistic overrides
    for (const [key, isFavorite] of Object.entries(overrides)) {
      if (isFavorite) {
        set.add(key);
      } else {
        set.delete(key);
      }
    }
    
    return set;
  }, [convexFavorites, overrides, version]);
  
  // Check if a specific item is favorited
  const isFavorited = useCallback(
    (generationId: string, mediaType: MediaType, index: number): boolean => {
      const key = makeFavoriteKey(generationId, mediaType, index);
      return favoriteSet.has(key);
    },
    [favoriteSet]
  );
  
  // Toggle favorite with optimistic update
  const toggleFavorite = useCallback(
    async (generationId: string, mediaType: MediaType, index: number): Promise<void> => {
      const key = makeFavoriteKey(generationId, mediaType, index);
      const currentlyFavorited = favoriteSet.has(key);
      const newValue = !currentlyFavorited;
      
      // Optimistically update UI immediately
      setOptimisticOverride(key, newValue);
      
      try {
        // Call the mutation
        await toggleFavoriteMutation({
          generationId: generationId as Id<"sessionGenerations">,
          mediaType,
          mediaIndex: index,
        });
        
        // On success, clear the override (server state will be correct)
        clearOptimisticOverride(key);
      } catch (error) {
        console.error("Failed to toggle favorite:", error);
        // On error, revert the optimistic update
        clearOptimisticOverride(key);
        throw error;
      }
    },
    [favoriteSet, toggleFavoriteMutation, setOptimisticOverride, clearOptimisticOverride]
  );
  
  // Normalize favorites for return
  const favorites = useMemo(() => {
    if (!convexFavorites) return [];
    return convexFavorites.map((f: any) => ({
      generationId: f.generationId as string,
      mediaType: f.mediaType as MediaType,
      mediaIndex: f.mediaIndex as number,
    }));
  }, [convexFavorites]);
  
  return {
    favoriteSet,
    isFavorited,
    toggleFavorite,
    favorites,
    isLoading: convexFavorites === undefined,
  };
}

export default useFavorites;
