/**
 * Image Generation Engine Hook
 * Orchestrates: slot acquire → credit reserve → API call → polling → Convex updates
 * Mirrors web's content-grid.tsx generation flow
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { useAuth } from "@clerk/clerk-expo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { apiRequest } from "../lib/api";
import { withGenerationSlotLock } from "../lib/generationSlotQueue";
import {
  ImageModelId,
  AspectRatio,
  Resolution,
  Quality,
  getModelById,
  calculateImageCost,
  validateAttachments,
  POLLING_CONFIG,
  DEFAULT_SETTINGS,
} from "../config/imageModels";

// Storage keys for persisting settings
const STORAGE_KEYS = {
  MODEL_ID: "@image_gen_model_id",
  ASPECT_RATIO: "@image_gen_aspect_ratio",
  NUM_IMAGES: "@image_gen_num_images",
  RESOLUTION: "@image_gen_resolution",
  QUALITY: "@image_gen_quality",
};

// Generation request shape
export interface GenerationRequest {
  prompt: string;
  modelId: ImageModelId;
  aspectRatio: AspectRatio;
  numImages: number;
  attachmentImages?: Array<{ url: string }>;
  resolution?: Resolution;
  quality?: Quality;
  sessionId?: string;
  onSessionId?: (sessionId: string) => void;
}

// Generation status
export type GenerationStatus =
  | "idle"
  | "acquiring_slot"
  | "reserving_credits"
  | "creating_session"
  | "generating"
  | "polling"
  | "completing"
  | "completed"
  | "failed";

// Generation result
export interface GenerationResult {
  success: boolean;
  images?: Array<{ url: string }>;
  error?: string;
  generationId?: string;
  sessionId?: string;
}

// API response types
interface GenerateImagesResponse {
  success?: boolean;
  queued?: boolean;
  requestId?: string;
  images?: Array<{ url: string }>;
  error?: string;
}

interface StatusResponse {
  success?: boolean;
  queued?: boolean;
  images?: Array<{ url: string }>;
  error?: string;
}

// Hook state
interface GenerationState {
  status: GenerationStatus;
  error: string | null;
  currentRequestId: string | null;
  progress: number; // 0-100 for UI feedback
}

export function useImageGeneration() {
  const { getToken } = useAuth();
  const [state, setState] = useState<GenerationState>({
    status: "idle",
    error: null,
    currentRequestId: null,
    progress: 0,
  });

  // Persisted settings
  const [settings, setSettings] = useState({
    modelId: DEFAULT_SETTINGS.modelId,
    aspectRatio: DEFAULT_SETTINGS.aspectRatio,
    numImages: DEFAULT_SETTINGS.numImages,
    resolution: DEFAULT_SETTINGS.resolution,
    quality: DEFAULT_SETTINGS.quality,
  });

  // Abort controller for cancellation
  const abortControllerRef = useRef<AbortController | null>(null);
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Convex mutations
  const acquireSlot = useMutation(api.generations.acquireGenerationSlot);
  const updateSlotStatus = useMutation(api.generations.updateGenerationStatus);
  const reserveCredits = useMutation(api.users.reserveCredits);
  const captureCredits = useMutation(api.users.captureReservedCredits);
  const releaseCredits = useMutation(api.users.releaseReservedCredits);
  const createSession = useMutation(api.sessions.createSession);
  const addGeneration = useMutation(api.sessions.addGenerationToSession);
  const updateGeneration = useMutation(api.sessions.updateGeneration);

  // Load persisted settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const [modelId, aspectRatio, numImages, resolution, quality] =
        await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.MODEL_ID),
          AsyncStorage.getItem(STORAGE_KEYS.ASPECT_RATIO),
          AsyncStorage.getItem(STORAGE_KEYS.NUM_IMAGES),
          AsyncStorage.getItem(STORAGE_KEYS.RESOLUTION),
          AsyncStorage.getItem(STORAGE_KEYS.QUALITY),
        ]);

      setSettings((prev) => ({
        modelId: (modelId as ImageModelId) || prev.modelId,
        aspectRatio: (aspectRatio as AspectRatio) || prev.aspectRatio,
        numImages: numImages ? parseInt(numImages, 10) : prev.numImages,
        resolution: (resolution as Resolution) || prev.resolution,
        quality: (quality as Quality) || prev.quality,
      }));
    } catch (error) {
      console.error("Failed to load settings:", error);
    }
  };

  const saveSettings = async (newSettings: Partial<typeof settings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);

    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.MODEL_ID, updated.modelId),
        AsyncStorage.setItem(STORAGE_KEYS.ASPECT_RATIO, updated.aspectRatio),
        AsyncStorage.setItem(STORAGE_KEYS.NUM_IMAGES, updated.numImages.toString()),
        AsyncStorage.setItem(STORAGE_KEYS.RESOLUTION, updated.resolution),
        AsyncStorage.setItem(STORAGE_KEYS.QUALITY, updated.quality),
      ]);
    } catch (error) {
      console.error("Failed to save settings:", error);
    }
  };

  // Poll for queued generation status
  const pollStatus = useCallback(
    async (
      requestId: string,
      modelId: ImageModelId,
      token: string
    ): Promise<{ success: boolean; images?: Array<{ url: string }>; error?: string }> => {
      let attempts = 0;
      let delay = POLLING_CONFIG.initialDelay;

      while (attempts < POLLING_CONFIG.maxAttempts) {
        if (abortControllerRef.current?.signal.aborted) {
          throw new Error("Generation cancelled");
        }

        await new Promise((resolve) => {
          pollingTimeoutRef.current = setTimeout(resolve, delay);
        });

        try {
          const response = await apiRequest<StatusResponse>(
            `/api/generate-images/status?requestId=${encodeURIComponent(requestId)}&modelId=${encodeURIComponent(modelId)}`,
            {
              method: "GET",
              token,
            }
          );

          if (response.success && response.images) {
            return { success: true, images: response.images };
          }

          if (response.error) {
            return { success: false, error: response.error };
          }

          // Still queued, continue polling
          setState((prev) => ({
            ...prev,
            progress: Math.min(90, 20 + (attempts / POLLING_CONFIG.maxAttempts) * 70),
          }));
        } catch (error) {
          console.error("Polling error:", error);
          // Continue polling on network errors
        }

        attempts++;
        delay = Math.min(delay * POLLING_CONFIG.backoffMultiplier, POLLING_CONFIG.maxDelay);
      }

      return { success: false, error: "Generation timed out" };
    },
    []
  );

  // Main generation function
  const generate = useCallback(
    async (request: GenerationRequest): Promise<GenerationResult> => {
      const {
        prompt,
        modelId,
        aspectRatio,
        numImages,
        attachmentImages,
        resolution,
        quality,
        sessionId: existingSessionId,
        onSessionId,
      } = request;

      // Reset state
      abortControllerRef.current = new AbortController();
      setState({
        status: "acquiring_slot",
        error: null,
        currentRequestId: null,
        progress: 5,
      });

      let slotId: Id<"generations"> | null = null;
      let creditAmount = 0;
      let sessionId = existingSessionId;
      let generationId: Id<"sessionGenerations"> | null = null;

      try {
        // Validate model and attachments
        const model = getModelById(modelId);
        if (!model) {
          throw new Error(`Unknown model: ${modelId}`);
        }

        const attachmentValidation = validateAttachments(
          modelId,
          attachmentImages?.length ?? 0
        );
        if (!attachmentValidation.valid) {
          throw new Error(attachmentValidation.message);
        }

        // 1. Acquire generation slot
        setState((prev) => ({ ...prev, status: "acquiring_slot", progress: 10 }));
        const slotResult = await withGenerationSlotLock(() =>
          acquireSlot({ type: "image", prompt } as any)
        );
        console.log("[useImageGeneration] acquireSlot result:", JSON.stringify(slotResult));

        // Handle both response formats: { success, generationId } or direct Id
        if (!slotResult) {
          throw new Error("Failed to acquire generation slot - no result");
        }

        // New response format: { ok: boolean, reason?: 'limit_reached', limit, active, generationId }
        if (typeof slotResult === "object" && slotResult !== null && "ok" in slotResult) {
          const result: any = slotResult;
          if (result.ok === false) {
            if (result.reason === "limit_reached") {
              throw new Error(
                `Concurrent generation limit reached (${result.active}/${result.limit}). Please wait or upgrade your plan.`
              );
            }
            throw new Error(result.message || "Failed to acquire generation slot");
          }
          if (!result.generationId) {
            throw new Error("Failed to acquire generation slot - missing generationId");
          }
          slotId = result.generationId as Id<"generations">;
        } else if (typeof slotResult === "string") {
          // Direct ID string returned
          slotId = slotResult as Id<"generations">;
        } else if (typeof slotResult === "object") {
          // Object response - check for success/failure
          if ("success" in slotResult && slotResult.success === false) {
            throw new Error((slotResult as any).message || "Failed to acquire generation slot");
          }
          // Extract generationId from object or use the object itself if it's the ID
          slotId = (slotResult as any).generationId ?? (slotResult as any)._id ?? slotResult;
        } else {
          throw new Error(`Unexpected slot result type: ${typeof slotResult}`);
        }

        console.log("[useImageGeneration] slotId:", slotId);

        // 2. Reserve credits
        setState((prev) => ({ ...prev, status: "reserving_credits", progress: 15 }));
        creditAmount = calculateImageCost(modelId, numImages);
        const creditResult = await reserveCredits({ amount: creditAmount });
        // Handle both response formats
        if (typeof creditResult === "object" && creditResult !== null && "success" in creditResult) {
          if (!creditResult.success) {
            throw new Error((creditResult as any).message || "Insufficient credits");
          }
        } else if (!creditResult) {
          throw new Error("Insufficient credits");
        }

        // 3. Create or use session
        setState((prev) => ({ ...prev, status: "creating_session", progress: 20 }));
        if (!sessionId) {
          const sessionResult = await createSession({
            title: prompt.slice(0, 50) + (prompt.length > 50 ? "..." : ""),
            type: "image",
          });
          sessionId = sessionResult;
          if (typeof sessionId === "string") {
            onSessionId?.(sessionId);
          }
        }

        // 4. Add loading generation to session
        const genResult = await addGeneration({
          sessionId: sessionId as Id<"sessions">,
          prompt,
          type: "image",
          model: modelId,
          modelLabel: model.label,
          aspectRatio,
          numImages,
          isLoading: true,
          concurrencySlotId: slotId,
          quality: quality,
        });
        generationId = genResult;

        // 5. Get auth token
        const token = await getToken();
        console.log("[useImageGeneration] Got token:", token ? `${token.substring(0, 20)}...` : "null");
        if (!token) {
          throw new Error("Authentication required");
        }

        // 6. Call generation API
        setState((prev) => ({ ...prev, status: "generating", progress: 25 }));
        console.log("[useImageGeneration] Calling API:", "/api/mobile/generate-images");

        const apiPayload: Record<string, unknown> = {
          prompt,
          model: modelId,
          aspectRatio,
          numImages,
        };

        if (attachmentImages && attachmentImages.length > 0) {
          apiPayload.attachmentImages = attachmentImages;
        }

        if (resolution && model.supportsResolution) {
          apiPayload.resolution = resolution;
        }

        if (quality && model.supportsQuality) {
          apiPayload.quality = quality;
        }

        const response = await apiRequest<GenerateImagesResponse>(
          "/api/mobile/generate-images",
          {
            method: "POST",
            body: apiPayload,
            token,
          }
        );

        let finalImages: Array<{ url: string }> = [];

        if (response.queued && response.requestId) {
          // 7. Queued model - poll for result
          setState((prev) => ({
            ...prev,
            status: "polling",
            currentRequestId: response.requestId!,
            progress: 30,
          }));

          const pollResult = await pollStatus(response.requestId, modelId, token);

          if (!pollResult.success || !pollResult.images) {
            throw new Error(pollResult.error || "Generation failed");
          }

          finalImages = pollResult.images;
        } else if (response.success && response.images) {
          // Immediate result
          finalImages = response.images;
        } else {
          throw new Error(response.error || "Generation failed");
        }

        // 8. Update generation in Convex
        setState((prev) => ({ ...prev, status: "completing", progress: 95 }));
        // Strip extra fields (like 'id') - Convex only accepts { url, imageBytes }
        const cleanImages = finalImages.map(({ url }) => ({ url }));
        await updateGeneration({
          generationId: generationId,
          isLoading: false,
          images: cleanImages,
          completedAt: Date.now(),
        });

        // 9. Capture credits and complete slot
        await captureCredits({ amount: creditAmount });
        await updateSlotStatus({
          generationId: slotId,
          status: "completed",
          imageUrl: finalImages[0]?.url,
        });

        setState({
          status: "completed",
          error: null,
          currentRequestId: null,
          progress: 100,
        });

        return {
          success: true,
          images: finalImages,
          generationId: generationId ?? undefined,
          sessionId,
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Generation failed";

        console.error("Generation error:", error);

        // Cleanup on failure
        try {
          if (generationId) {
            await updateGeneration({
              generationId,
              isLoading: false,
              error: errorMessage,
            });
          }

          if (creditAmount > 0) {
            await releaseCredits({ amount: creditAmount });
          }

          if (slotId) {
            await updateSlotStatus({
              generationId: slotId,
              status: "failed",
            });
          }
        } catch (cleanupError) {
          console.error("Cleanup error:", cleanupError);
        }

        setState({
          status: "failed",
          error: errorMessage,
          currentRequestId: null,
          progress: 0,
        });

        return { success: false, error: errorMessage };
      }
    },
    [
      acquireSlot,
      reserveCredits,
      createSession,
      addGeneration,
      updateGeneration,
      captureCredits,
      releaseCredits,
      updateSlotStatus,
      getToken,
      pollStatus,
    ]
  );

  // Cancel ongoing generation
  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
    }
    setState((prev) => ({
      ...prev,
      status: "idle",
      error: "Cancelled",
      currentRequestId: null,
      progress: 0,
    }));
  }, []);

  // Reset state
  const reset = useCallback(() => {
    setState({
      status: "idle",
      error: null,
      currentRequestId: null,
      progress: 0,
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
      }
    };
  }, []);

  return {
    // State
    status: state.status,
    error: state.error,
    progress: state.progress,
    isGenerating:
      state.status !== "idle" &&
      state.status !== "completed" &&
      state.status !== "failed",

    // Settings
    settings,
    updateSettings: saveSettings,

    // Actions
    generate,
    cancel,
    reset,
  };
}

export default useImageGeneration;
