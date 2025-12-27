import { useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { useNetworkStatus } from "../lib/network";
import useOfflineQueueStore from "../state/offlineQueueStore";
import useGenerationsCacheStore from "../state/generationsCache";

// Placeholder import - replace with actual generated API
// import { api } from "../../convex/_generated/api";

interface CreateGenerationParams {
  prompt: string;
  style?: string;
  aspectRatio?: string;
  model?: string;
}

export function useGenerations() {
  const { isConnected } = useNetworkStatus();
  const { addPendingGeneration, pendingGenerations } = useOfflineQueueStore();
  const { generations: cachedGenerations, setGenerations } =
    useGenerationsCacheStore();

  // TODO: Uncomment when Convex API is available
  // const generations = useQuery(api.generations.listForUser);
  // const createMutation = useMutation(api.generations.create);

  // Placeholder for demo - remove when Convex is connected
  const generations: any[] | undefined = undefined;
  const createMutation = async (_params: CreateGenerationParams) => {
    throw new Error("Convex not connected yet");
  };

  const createGeneration = useCallback(
    async (params: CreateGenerationParams) => {
      if (isConnected) {
        try {
          const result = await createMutation(params);
          return result;
        } catch (error) {
          console.error("Failed to create generation:", error);
          // Fall back to offline queue
          const localId = addPendingGeneration(params);
          return { localId, offline: true };
        }
      } else {
        // Queue for later sync
        const localId = addPendingGeneration(params);
        return { localId, offline: true };
      }
    },
    [isConnected, createMutation, addPendingGeneration]
  );

  // Combine online data with pending offline items
  const allGenerations = [
    // Pending items first
    ...pendingGenerations
      .filter((p) => p.status !== "synced")
      .map((p) => ({
        id: p.localId,
        prompt: p.prompt,
        style: p.style,
        aspectRatio: p.aspectRatio,
        model: p.model,
        status: p.status === "pending" ? "queued" : p.status,
        isLocal: true,
        createdAt: p.createdAt,
      })),
    // Then server data or cached data
    ...(generations ?? cachedGenerations),
  ];

  // Cache generations when online
  // useEffect(() => {
  //   if (generations && isConnected) {
  //     setGenerations(generations);
  //   }
  // }, [generations, isConnected, setGenerations]);

  return {
    generations: allGenerations,
    isLoading: generations === undefined && isConnected,
    isOffline: !isConnected,
    createGeneration,
    pendingCount: pendingGenerations.filter((p) => p.status === "pending")
      .length,
  };
}

export default useGenerations;
