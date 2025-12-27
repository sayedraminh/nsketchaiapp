import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface CachedAssetItem {
  id: string;
  generationId: string;
  sessionId?: string;
  mediaType: "image" | "video";
  index: number;
  url: string;
  previewUrl?: string;
  prompt?: string;
  createdAt?: number;
  isEnhanced?: boolean;
  isFavorite?: boolean;
  aspectRatio?: string;
}

export interface CachedFavorite {
  generationId: string;
  mediaType: "image" | "video";
  mediaIndex: number;
}

interface AssetsCacheState {
  assets: CachedAssetItem[];
  favorites: CachedFavorite[];
  assetsSessionId: string | null;
  lastFetchedAt: number | null;
  userId: string | null;

  // Actions
  setUserId: (userId: string | null) => void;
  setAssetsSessionId: (sessionId: string | null) => void;
  setAssets: (assets: CachedAssetItem[]) => void;
  setFavorites: (favorites: CachedFavorite[]) => void;
  updateAsset: (id: string, updates: Partial<CachedAssetItem>) => void;
  removeAsset: (id: string) => void;
  toggleAssetFavorite: (generationId: string, mediaType: "image" | "video", mediaIndex: number) => void;
  getAssets: () => CachedAssetItem[];
  getFavorites: () => CachedFavorite[];
  isFavorite: (generationId: string, mediaType: "image" | "video", mediaIndex: number) => boolean;
  clearCache: () => void;
}

const MAX_CACHED_ASSETS = 200;

const useAssetsCacheStore = create<AssetsCacheState>()(
  persist(
    (set, get) => ({
      assets: [],
      favorites: [],
      assetsSessionId: null,
      lastFetchedAt: null,
      userId: null,

      setUserId: (userId) => {
        const currentUserId = get().userId;
        if (currentUserId !== userId) {
          set({
            userId,
            assets: [],
            favorites: [],
            assetsSessionId: null,
            lastFetchedAt: null,
          });
        }
      },

      setAssetsSessionId: (sessionId) => {
        set({ assetsSessionId: sessionId });
      },

      setAssets: (assets) => {
        set({
          assets: assets.slice(0, MAX_CACHED_ASSETS),
          lastFetchedAt: Date.now(),
        });
      },

      setFavorites: (favorites) => {
        set({ favorites });
      },

      updateAsset: (id, updates) => {
        set((state) => ({
          assets: state.assets.map((asset) =>
            asset.id === id ? { ...asset, ...updates } : asset
          ),
        }));
      },

      removeAsset: (id) => {
        set((state) => ({
          assets: state.assets.filter((asset) => asset.id !== id),
        }));
      },

      toggleAssetFavorite: (generationId, mediaType, mediaIndex) => {
        const state = get();
        const existingIndex = state.favorites.findIndex(
          (f) =>
            f.generationId === generationId &&
            f.mediaType === mediaType &&
            f.mediaIndex === mediaIndex
        );

        if (existingIndex >= 0) {
          // Remove from favorites
          set((state) => ({
            favorites: state.favorites.filter((_, i) => i !== existingIndex),
            assets: state.assets.map((asset) =>
              asset.generationId === generationId &&
              asset.mediaType === mediaType &&
              asset.index === mediaIndex
                ? { ...asset, isFavorite: false }
                : asset
            ),
          }));
        } else {
          // Add to favorites
          set((state) => ({
            favorites: [...state.favorites, { generationId, mediaType, mediaIndex }],
            assets: state.assets.map((asset) =>
              asset.generationId === generationId &&
              asset.mediaType === mediaType &&
              asset.index === mediaIndex
                ? { ...asset, isFavorite: true }
                : asset
            ),
          }));
        }
      },

      getAssets: () => {
        return get().assets;
      },

      getFavorites: () => {
        return get().favorites;
      },

      isFavorite: (generationId, mediaType, mediaIndex) => {
        return get().favorites.some(
          (f) =>
            f.generationId === generationId &&
            f.mediaType === mediaType &&
            f.mediaIndex === mediaIndex
        );
      },

      clearCache: () => {
        set({
          assets: [],
          favorites: [],
          assetsSessionId: null,
          lastFetchedAt: null,
        });
      },
    }),
    {
      name: "assets-cache-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useAssetsCacheStore;
