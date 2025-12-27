import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface CachedGeneration {
  id: string;
  prompt: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  status: "queued" | "running" | "completed" | "failed";
  style?: string;
  aspectRatio?: string;
  model?: string;
  createdAt: number;
  updatedAt: number;
}

interface GenerationsCacheState {
  generations: CachedGeneration[];
  lastFetchedAt: number | null;
  userId: string | null;
  setUserId: (userId: string | null) => void;
  setGenerations: (generations: CachedGeneration[]) => void;
  updateGeneration: (id: string, updates: Partial<CachedGeneration>) => void;
  addGeneration: (generation: CachedGeneration) => void;
  getGenerations: () => CachedGeneration[];
  clearCache: () => void;
}

const MAX_CACHED_GENERATIONS = 50;

const useGenerationsCacheStore = create<GenerationsCacheState>()(
  persist(
    (set, get) => ({
      generations: [],
      lastFetchedAt: null,
      userId: null,

      setUserId: (userId) => {
        const currentUserId = get().userId;
        if (currentUserId !== userId) {
          set({
            userId,
            generations: [],
            lastFetchedAt: null,
          });
        }
      },

      setGenerations: (generations) => {
        set({
          generations: generations.slice(0, MAX_CACHED_GENERATIONS),
          lastFetchedAt: Date.now(),
        });
      },

      updateGeneration: (id, updates) => {
        set((state) => ({
          generations: state.generations.map((gen) =>
            gen.id === id ? { ...gen, ...updates, updatedAt: Date.now() } : gen
          ),
        }));
      },

      addGeneration: (generation) => {
        set((state) => ({
          generations: [generation, ...state.generations].slice(
            0,
            MAX_CACHED_GENERATIONS
          ),
        }));
      },

      getGenerations: () => {
        return get().generations;
      },

      clearCache: () => {
        set({
          generations: [],
          lastFetchedAt: null,
        });
      },
    }),
    {
      name: "generations-cache-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useGenerationsCacheStore;
