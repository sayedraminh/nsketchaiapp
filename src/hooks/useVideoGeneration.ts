/**
 * Video Generation Engine Hook
 * Orchestrates: slot acquire → credit reserve → API call → polling → Convex updates
 * Mirrors web's content-grid.tsx video generation flow
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { useMutation } from "convex/react";
import { useAuth } from "@clerk/clerk-expo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { apiRequest } from "../lib/api";
import { withGenerationSlotLock } from "../lib/generationSlotQueue";
import {
  VideoModelId,
  VideoAspectRatio,
  VideoDuration,
  VideoResolution,
  getVideoModelById,
  calculateVideoCost,
  validateVideoAttachments,
  VIDEO_POLLING_CONFIG,
  DEFAULT_VIDEO_SETTINGS,
} from "../config/videoModels";


// Mobile API endpoint routing based on model ID
// POST goes to mobile endpoint (no Turnstile), STATUS goes to web endpoint (already works)
function getMobileVideoEndpoint(modelId: VideoModelId): { endpoint: string; statusEndpoint: string } {
  
  // KIE Sora 2
  if (modelId === "kie-sora-2") {
    return {
      endpoint: "/api/mobile/kie-sora-2",
      statusEndpoint: "/api/kie-sora-2/status", // Web status endpoint
    };
  }

  // KIE Wan 2.5
  if (modelId === "kie-wan-2.5") {
    return {
      endpoint: "/api/mobile/kie-wan-2.5",
      statusEndpoint: "/api/kie-wan-2.5/status", // Web status endpoint
    };
  }

  // KIE Seedance 1.5 Pro models
  if (modelId === "kie-seedance-1.5-pro") {
    return {
      endpoint: "/api/mobile/kie-seedance-1.5-pro",
      statusEndpoint: "/api/kie-seedance-1.5-pro/status", // Web status endpoint
    };
  }


  // Pixverse Models (uses FAL under the hood)
  if (modelId === "pixverse-v5") {
    return {
      endpoint: "/api/mobile/pixverse-video",
      statusEndpoint: "/api/fal-generate-videos/status", // Unified FAL status endpoint
    };
  }

  // FAL Models (Veo, Kling 2.6/O1, Lucy, Hailuo, etc.)
  // Use mobile POST, but WEB status endpoint (like images do)
  return {
    endpoint: "/api/mobile/generate-video",
    statusEndpoint: "/api/fal-generate-videos/status", // WEB status endpoint - works!
  };
}

// Storage keys for persisting settings
const STORAGE_KEYS = {
  MODEL_ID: "@video_gen_model_id",
  ASPECT_RATIO: "@video_gen_aspect_ratio",
  DURATION: "@video_gen_duration",
  RESOLUTION: "@video_gen_resolution",
  GENERATE_AUDIO: "@video_gen_audio",
  FAST_MODE: "@video_gen_fast_mode",
};

// Generation request shape
export interface VideoGenerationRequest {
  prompt: string;
  modelId: VideoModelId;
  aspectRatio: VideoAspectRatio;
  duration: VideoDuration;
  resolution?: VideoResolution;
  generateAudio?: boolean;
  fastMode?: boolean;
  removeWatermark?: boolean;
  cameraFixed?: boolean;
  // Attachments
  attachmentImageUrl?: string; // Single image for I2V
  startFrameImageUrl?: string; // For transitions
  endFrameImageUrl?: string; // For transitions
  klingO1Images?: Array<{ url: string }>; // For Kling O1 reference mode
  sessionId?: string;
  onSessionId?: (sessionId: string) => void;
}

// Generation status
export type VideoGenerationStatus =
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
export interface VideoGenerationResult {
  success: boolean;
  videos?: Array<{ url: string }>;
  error?: string;
  generationId?: string;
  sessionId?: string;
}

// API response types
interface GenerateVideoResponse {
  success?: boolean;
  queued?: boolean;
  processing?: boolean;
  requestId?: string;
  request_id?: string; // snake_case version
  taskId?: string; // KIE endpoints return taskId
  task_id?: string; // snake_case version
  recordId?: string; // KIE endpoints also return recordId
  operationName?: string;
  operation_name?: string; // snake_case version
  endpoint?: string; // FAL returns endpoint
  videos?: Array<{ url: string }>;
  error?: string;
  modelId?: string;
  provider?: string;
}

interface VideoStatusResponse {
  success?: boolean;
  queued?: boolean;
  processing?: boolean;
  status?: string;
  videos?: Array<string | { url: string }>; // Can be string[] or {url}[]
  video?: string | { url: string }; // KIE may return single video
  videoUrl?: string; // KIE may return videoUrl directly
  error?: string;
}

// Hook state
interface VideoGenerationState {
  status: VideoGenerationStatus;
  error: string | null;
  currentRequestId: string | null;
  progress: number; // 0-100 for UI feedback
}

export function useVideoGeneration() {
  const { getToken } = useAuth();
  const [state, setState] = useState<VideoGenerationState>({
    status: "idle",
    error: null,
    currentRequestId: null,
    progress: 0,
  });

  // Persisted settings
  const [settings, setSettings] = useState({
    modelId: DEFAULT_VIDEO_SETTINGS.modelId,
    aspectRatio: DEFAULT_VIDEO_SETTINGS.aspectRatio,
    duration: DEFAULT_VIDEO_SETTINGS.duration,
    resolution: DEFAULT_VIDEO_SETTINGS.resolution,
    generateAudio: DEFAULT_VIDEO_SETTINGS.generateAudio,
    fastMode: DEFAULT_VIDEO_SETTINGS.fastMode,
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
      const [modelId, aspectRatio, duration, resolution, generateAudio, fastMode] =
        await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.MODEL_ID),
          AsyncStorage.getItem(STORAGE_KEYS.ASPECT_RATIO),
          AsyncStorage.getItem(STORAGE_KEYS.DURATION),
          AsyncStorage.getItem(STORAGE_KEYS.RESOLUTION),
          AsyncStorage.getItem(STORAGE_KEYS.GENERATE_AUDIO),
          AsyncStorage.getItem(STORAGE_KEYS.FAST_MODE),
        ]);

      setSettings((prev) => ({
        modelId: (modelId as VideoModelId) || prev.modelId,
        aspectRatio: (aspectRatio as VideoAspectRatio) || prev.aspectRatio,
        duration: duration ? (parseInt(duration, 10) as VideoDuration) : prev.duration,
        resolution: (resolution as VideoResolution) || prev.resolution,
        generateAudio: generateAudio !== null ? generateAudio === "true" : prev.generateAudio,
        fastMode: fastMode !== null ? fastMode === "true" : prev.fastMode,
      }));
    } catch (error) {
      console.error("Failed to load video settings:", error);
    }
  };

  const saveSettings = async (newSettings: Partial<typeof settings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);

    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.MODEL_ID, updated.modelId),
        AsyncStorage.setItem(STORAGE_KEYS.ASPECT_RATIO, updated.aspectRatio),
        AsyncStorage.setItem(STORAGE_KEYS.DURATION, updated.duration.toString()),
        AsyncStorage.setItem(STORAGE_KEYS.RESOLUTION, updated.resolution),
        AsyncStorage.setItem(STORAGE_KEYS.GENERATE_AUDIO, updated.generateAudio.toString()),
        AsyncStorage.setItem(STORAGE_KEYS.FAST_MODE, updated.fastMode.toString()),
      ]);
    } catch (error) {
      console.error("Failed to save video settings:", error);
    }
  };

  // Poll for queued video generation status
  const pollStatus = useCallback(
    async (
      requestId: string,
      modelId: VideoModelId,
      falEndpoint?: string // FAL endpoint for status lookup
    ): Promise<{ success: boolean; videos?: Array<{ url: string }>; error?: string }> => {
      let attempts = 0;
      let delay = VIDEO_POLLING_CONFIG.initialDelay;
      const { statusEndpoint } = getMobileVideoEndpoint(modelId);

      while (attempts < VIDEO_POLLING_CONFIG.maxAttempts) {
        if (abortControllerRef.current?.signal.aborted) {
          throw new Error("Video generation cancelled");
        }

        await new Promise((resolve) => {
          pollingTimeoutRef.current = setTimeout(resolve, delay);
        });

        try {
          // Determine correct query param based on model/endpoint
          const isKieModel = modelId.startsWith("kie-");
          
          let queryParam: string;
          if (isKieModel) {
            queryParam = "taskId";
          } else {
            queryParam = "requestId";
          }
          
          // Build query string - include endpoint for FAL models
          let queryString = `${queryParam}=${encodeURIComponent(requestId)}&modelId=${encodeURIComponent(modelId)}`;
          if (falEndpoint) {
            queryString += `&endpoint=${encodeURIComponent(falEndpoint)}`;
          }
          
          // Refresh token on each poll to avoid expiry (Clerk tokens are ~60s)
          const freshToken = await getToken();
          if (!freshToken) {
            throw new Error("Authentication expired during polling");
          }
          
          console.log(`[useVideoGeneration] Polling ${statusEndpoint}?${queryString}`);
          
          const response = await apiRequest<VideoStatusResponse>(
            `${statusEndpoint}?${queryString}`,
            {
              method: "GET",
              token: freshToken,
            }
          );

          console.log("[useVideoGeneration] Poll response:", JSON.stringify(response));

          // Handle different video response formats - normalize to string[]
          let videoUrls: string[] | undefined;
          if (response.videos) {
            // videos could be string[] or {url: string}[]
            videoUrls = response.videos.map((v: string | { url: string }) => 
              typeof v === 'string' ? v : v.url
            );
          } else if (response.video) {
            videoUrls = [typeof response.video === 'string' ? response.video : response.video.url];
          } else if (response.videoUrl) {
            videoUrls = [response.videoUrl];
          }

          if (response.success && videoUrls) {
            return { success: true, videos: videoUrls.map(url => ({ url })) };
          }

          if (response.error) {
            return { success: false, error: response.error };
          }

          // Still processing, continue polling
          setState((prev) => ({
            ...prev,
            progress: Math.min(90, 20 + (attempts / VIDEO_POLLING_CONFIG.maxAttempts) * 70),
          }));
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error("Video polling error:", errorMessage);
          
          // Check if this is a fatal error (4xx with failure message) vs transient (network/5xx)
          const isFatalError = 
            errorMessage.includes("failed") ||
            errorMessage.includes("error") ||
            errorMessage.includes("policy") ||
            errorMessage.includes("flagged") ||
            errorMessage.includes("violation") ||
            errorMessage.includes("(4") || // 4xx status codes
            errorMessage.includes("422") ||
            errorMessage.includes("400") ||
            errorMessage.includes("403");
          
          if (isFatalError) {
            // Fatal error - stop polling and return failure
            return { success: false, error: errorMessage };
          }
          // Transient error - continue polling
        }

        attempts++;
        delay = Math.min(delay * VIDEO_POLLING_CONFIG.backoffMultiplier, VIDEO_POLLING_CONFIG.maxDelay);
      }

      return { success: false, error: "Video generation timed out" };
    },
    []
  );

  // Main video generation function
  const generate = useCallback(
    async (request: VideoGenerationRequest): Promise<VideoGenerationResult> => {
      const {
        prompt,
        modelId,
        aspectRatio,
        duration,
        resolution,
        generateAudio,
        fastMode,
        removeWatermark,
        cameraFixed,
        attachmentImageUrl,
        startFrameImageUrl,
        endFrameImageUrl,
        klingO1Images,
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
        const model = getVideoModelById(modelId);
        if (!model) {
          throw new Error(`Unknown video model: ${modelId}`);
        }

        // Count attachments
        let attachmentCount = 0;
        if (attachmentImageUrl) attachmentCount = 1;
        if (startFrameImageUrl && endFrameImageUrl) attachmentCount = 2;
        if (klingO1Images) attachmentCount = klingO1Images.length;

        const attachmentValidation = validateVideoAttachments(modelId, attachmentCount);
        if (!attachmentValidation.valid) {
          throw new Error(attachmentValidation.message);
        }

        // 1. Acquire generation slot
        setState((prev) => ({ ...prev, status: "acquiring_slot", progress: 10 }));
        const slotResult = await withGenerationSlotLock(() =>
          acquireSlot({ type: "video", prompt } as any)
        );
        console.log("[useVideoGeneration] acquireSlot result:", JSON.stringify(slotResult));

        // Handle both response formats
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
          slotId = slotResult as Id<"generations">;
        } else if (typeof slotResult === "object") {
          if ("success" in slotResult && slotResult.success === false) {
            throw new Error((slotResult as any).message || "Failed to acquire generation slot");
          }
          slotId = (slotResult as any).generationId ?? (slotResult as any)._id ?? slotResult;
        } else {
          throw new Error(`Unexpected slot result type: ${typeof slotResult}`);
        }

        console.log("[useVideoGeneration] slotId:", slotId);

        // 2. Reserve credits
        setState((prev) => ({ ...prev, status: "reserving_credits", progress: 15 }));
        creditAmount = calculateVideoCost(modelId, {
          resolution,
          hasAudio: generateAudio,
          duration,
          fastMode,
          removeWatermark,
        });
        const creditResult = await reserveCredits({ amount: creditAmount });
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
            type: "video",
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
          type: "video",
          model: modelId,
          modelLabel: model.label,
          aspectRatio,
          isLoading: true,
          concurrencySlotId: slotId,
        });
        generationId = genResult;

        // 5. Get auth token
        const token = await getToken();
        console.log("[useVideoGeneration] Got token:", token ? `${token.substring(0, 20)}...` : "null");
        if (!token) {
          throw new Error("Authentication required");
        }

        // 6. Call video generation API - route to correct endpoint based on model
        const { endpoint } = getMobileVideoEndpoint(modelId);
        setState((prev) => ({ ...prev, status: "generating", progress: 25 }));
        console.log("[useVideoGeneration] Calling API:", endpoint);

        const apiPayload: Record<string, unknown> = {
          prompt,
          model: modelId, // Backend handles model ID mapping
          aspectRatio,
          duration: Number(duration), // Ensure it's a number, not a string
        };

        if (resolution) apiPayload.resolution = resolution;
        if (generateAudio !== undefined) apiPayload.generateAudio = generateAudio;
        if (fastMode !== undefined) apiPayload.fastMode = fastMode;
        if (removeWatermark !== undefined) apiPayload.removeWatermark = removeWatermark;
        if (cameraFixed !== undefined) apiPayload.cameraFixed = cameraFixed;
        
        // Handle image attachments - use imageUrl for KIE routes, attachmentImageUrl for FAL
        if (attachmentImageUrl) {
          apiPayload.imageUrl = attachmentImageUrl;
          apiPayload.attachmentImageUrl = attachmentImageUrl;
        }
        if (startFrameImageUrl) {
          apiPayload.startFrameImageUrl = startFrameImageUrl;
          apiPayload.startImageUrl = startFrameImageUrl;
        }
        if (endFrameImageUrl) {
          apiPayload.endFrameImageUrl = endFrameImageUrl;
          apiPayload.endImageUrl = endFrameImageUrl;
        }
        if (klingO1Images) apiPayload.klingO1Images = klingO1Images;

        const response = await apiRequest<GenerateVideoResponse>(
          endpoint,
          {
            method: "POST",
            body: apiPayload,
            token,
          }
        );

        console.log("[useVideoGeneration] API response:", JSON.stringify(response));

        let finalVideos: Array<{ url: string }> = [];

        // Check if this is a queued/async generation
        // FAL returns: { queued: true, requestId: "..." }
        // KIE returns: { taskId: "..." }
        // Handle both camelCase and snake_case field names
        const pollId = response.requestId || response.request_id || 
                       response.taskId || response.task_id || 
                       response.operationName || response.operation_name ||
                       response.endpoint; // FAL uses endpoint as the request registry key
        const isQueued = response.queued || response.processing || !!response.taskId || !!response.task_id || !!pollId;
        
        console.log("[useVideoGeneration] pollId:", pollId, "isQueued:", isQueued);
        
        if (isQueued && pollId) {
          // Queued model - poll for result
          const falEndpoint = response.endpoint; // FAL returns endpoint for status lookup
          console.log("[useVideoGeneration] Queued generation, polling with ID:", pollId, "endpoint:", falEndpoint);
          setState((prev) => ({
            ...prev,
            status: "polling",
            currentRequestId: pollId,
            progress: 30,
          }));

          const pollResult = await pollStatus(pollId, modelId, falEndpoint);

          if (!pollResult.success || !pollResult.videos) {
            throw new Error(pollResult.error || "Video generation failed");
          }

          finalVideos = pollResult.videos;
        } else if (response.success && response.videos) {
          // Immediate result
          finalVideos = response.videos;
        } else {
          throw new Error(response.error || "Video generation failed");
        }

        // 8. Update generation in Convex - Convex expects videos as string[]
        setState((prev) => ({ ...prev, status: "completing", progress: 95 }));
        let videoUrlStrings = finalVideos.map(v => v.url);
        console.log("[useVideoGeneration] Saving videos to Convex:", videoUrlStrings);
        
        // 8a. Backup videos to R2 and extract first frame (async, non-blocking)
        let previewImageUrl: string | undefined;
        try {
          // Backup first video to R2
          const tempVideoUrl = videoUrlStrings[0];
          if (tempVideoUrl && tempVideoUrl.includes("tempfile.aiquickdraw.com")) {
            console.log("[useVideoGeneration] Backing up video to R2...");
            
            // Get presigned upload URL
            const presignResponse = await apiRequest<{
              success: boolean;
              uploadUrl: string;
              url: string;
              key: string;
            }>("/api/mobile/upload-video-presign", {
              method: "POST",
              body: { contentType: "video/mp4", fileName: "video.mp4" },
              token,
            });

            if (presignResponse.success && presignResponse.uploadUrl) {
              // Download temp video and upload to R2
              const videoResponse = await fetch(tempVideoUrl);
              const videoBlob = await videoResponse.blob();
              
              await fetch(presignResponse.uploadUrl, {
                method: "PUT",
                body: videoBlob,
                headers: { "Content-Type": "video/mp4" },
              });
              
              console.log("[useVideoGeneration] Video backed up to:", presignResponse.url);
              videoUrlStrings = [presignResponse.url]; // Replace temp URL with permanent
            }
          }

          // Extract first frame for preview
          console.log("[useVideoGeneration] Extracting first frame...");
          const frameResponse = await apiRequest<{
            success: boolean;
            url: string;
          }>("/api/mobile/extract-first-frame", {
            method: "POST",
            body: { videoUrl: videoUrlStrings[0] },
            token,
          });

          if (frameResponse.success && frameResponse.url) {
            previewImageUrl = frameResponse.url;
            console.log("[useVideoGeneration] First frame extracted:", previewImageUrl);
          }
        } catch (backupError) {
          console.warn("[useVideoGeneration] Backup/frame extraction failed (non-fatal):", backupError);
          // Continue with temp URLs - this is non-fatal
        }

        await updateGeneration({
          generationId: generationId,
          isLoading: false,
          videos: videoUrlStrings, // string[] - backed up or temp
          previewImage: previewImageUrl,
          completedAt: Date.now(),
        });

        // 9. Capture credits and complete slot
        await captureCredits({ amount: creditAmount });
        await updateSlotStatus({
          generationId: slotId,
          status: "completed",
          videoUrl: videoUrlStrings[0],
        });

        setState({
          status: "completed",
          error: null,
          currentRequestId: null,
          progress: 100,
        });

        return {
          success: true,
          videos: finalVideos,
          generationId: generationId ?? undefined,
          sessionId,
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Video generation failed";

        console.error("Video generation error:", error);

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

export default useVideoGeneration;
