/**
 * Shared Video Models Registry
 * Single source of truth for all video model IDs, metadata, and constraints
 * Mirrors web's video-prompt-bar.tsx VIDEO_MODELS
 */

// Video Model ID type for type safety - exact IDs from web
export type VideoModelId =
  // Veo 3.1 family
  | "vid-veo-3.1"
  | "vid-veo-3.1-fast"
  | "veo3.1-transition"
  | "veo3.1-fast-transition"
  // Kling family
  | "vid-kling-2.6-pro"
  | "vid-kling-2.5-pro"
  | "kling-2.5-turbo-transition"
  | "kling-o1"
  | "kling-o1-transition"
  // Sora
  | "kie-sora-2"
  // Wan family
  | "kie-wan-2.5"
  // MiniMax Hailuo
  | "vid-hailuo-2.3-pro"
  | "vid-hailuo-2.3"
  // Ovi
  | "vid-ovi"
  // Kandinsky
  | "vid-kandinsky-5"
  // Seedance family
  | "vid-seedance-lite"
  | "vid-seedance-pro"
  | "seedance-pro-transition"
  | "kie-seedance-1.5-pro"
  | "kie-seedance-1.5-pro-transition"
  // Pixverse
  | "pixverse-v5"
  | "pixverse-v5-transition"
  // Lucy (Decart)
  | "vid-lucy-lite"
  | "vid-lucy-pro"
;

// Video aspect ratio type
export type VideoAspectRatio = "16:9" | "9:16" | "1:1" | "4:3" | "3:4";

// Video duration type (in seconds)
export type VideoDuration = 4 | 5 | 6 | 8 | 10 | 12 | 15;

// Video resolution type
export type VideoResolution = "360p" | "480p" | "540p" | "720p" | "1080p";

// Valid aspect ratios for videos
export const VALID_VIDEO_ASPECT_RATIOS: VideoAspectRatio[] = [
  "16:9",
  "9:16",
  "1:1",
  "4:3",
  "3:4",
];

// Default aspect ratios (most models)
export const DEFAULT_VIDEO_ASPECT_RATIOS: VideoAspectRatio[] = ["16:9", "9:16"];

// Full aspect ratios (Veo, some others)
export const FULL_VIDEO_ASPECT_RATIOS: VideoAspectRatio[] = [
  "16:9",
  "9:16",
  "1:1",
  "4:3",
  "3:4",
];

// Video model metadata
export interface VideoModelMeta {
  id: VideoModelId;
  label: string;
  company: string;
  description: string;
  logo: string;
  isNew: boolean;
  // Attachment requirements
  requiresAttachment: boolean; // Must have attachment to generate
  isTransition: boolean; // Requires start + end frames
  supportsAttachment?: boolean; // Optional attachment support
  maxAttachments?: number;
  isTextOnly?: boolean; // No attachments allowed (e.g., Kandinsky)
  isImageOnly?: boolean; // Must have image to generate (e.g., Lucy)
  // Supported options - base (text-to-video)
  allowedAspectRatios: VideoAspectRatio[];
  allowedDurations: VideoDuration[];
  allowedResolutions?: VideoResolution[];
  // Dynamic options when image is attached (image-to-video)
  imageAttachedAspectRatios?: VideoAspectRatio[]; // AR options when image attached
  imageAttachedDurations?: VideoDuration[]; // Duration options when image attached
  hideAspectRatioWithImage?: boolean; // Hide AR selector when image attached
  hideAspectRatio?: boolean; // Always hide AR selector (e.g., fixed AR models)
  // UI toggles
  supportsAudio: boolean;
  defaultAudioOn?: boolean;
  supportsFastMode?: boolean;
  supportsWatermarkToggle?: boolean;
  supportsCameraFixed?: boolean;
  showResolutionSelector?: boolean; // Whether to show resolution dropdown in UI
  // Pricing
  baseCreditCost: number; // Base cost per video
  // Async behavior
  isQueued: boolean;
  provider: "fal" | "google" | "wavespeed" | "kie";
}

// Complete video model registry - exact IDs from web
export const VIDEO_MODELS: VideoModelMeta[] = [
  // Veo 3.1 family
  {
    id: "vid-veo-3.1",
    label: "Veo 3.1",
    company: "Google",
    description: "Google's latest text-to-video model with exceptional quality and audio",
    logo: "googleg",
    isNew: true,
    requiresAttachment: false,
    isTransition: false,
    supportsAttachment: true,
    maxAttachments: 1,
    // Text-only: ["16:9", "9:16", "1:1"], durations [4, 6, 8]
    allowedAspectRatios: ["16:9", "9:16", "1:1"],
    allowedDurations: [4, 6, 8],
    allowedResolutions: ["720p", "1080p"],
    showResolutionSelector: true,
    // With image: ["16:9", "9:16"], duration [8] only
    imageAttachedAspectRatios: ["16:9", "9:16"],
    imageAttachedDurations: [8],
    supportsAudio: true,
    defaultAudioOn: true,
    baseCreditCost: 240,
    isQueued: true,
    provider: "fal",
  },
  {
    id: "vid-veo-3.1-fast",
    label: "Veo 3.1 Fast",
    company: "Google",
    description: "Faster, cost-effective Veo 3.1 with audio",
    logo: "googleg",
    isNew: true,
    requiresAttachment: false,
    isTransition: false,
    supportsAttachment: true,
    maxAttachments: 1,
    // Same rules as vid-veo-3.1
    allowedAspectRatios: ["16:9", "9:16", "1:1"],
    allowedDurations: [4, 6, 8],
    allowedResolutions: ["720p", "1080p"],
    showResolutionSelector: true,
    imageAttachedAspectRatios: ["16:9", "9:16"],
    imageAttachedDurations: [8],
    supportsAudio: true,
    defaultAudioOn: true,
    baseCreditCost: 108,
    isQueued: true,
    provider: "fal",
  },
  {
    id: "veo3.1-transition",
    label: "Veo 3.1 Transition",
    company: "Google",
    description: "Create smooth transitions between two images with Veo quality",
    logo: "googleg",
    isNew: true,
    requiresAttachment: true,
    isTransition: true,
    maxAttachments: 2,
    // Transition: ["16:9", "9:16", "1:1"], duration [8] only
    allowedAspectRatios: ["16:9", "9:16", "1:1"],
    allowedDurations: [8],
    allowedResolutions: ["720p", "1080p"],
    showResolutionSelector: true,
    supportsAudio: true,
    defaultAudioOn: true,
    baseCreditCost: 240,
    isQueued: true,
    provider: "fal",
  },
  {
    id: "veo3.1-fast-transition",
    label: "Veo 3.1 Fast Transition",
    company: "Google",
    description: "Fast transitions between two images",
    logo: "googleg",
    isNew: true,
    requiresAttachment: true,
    isTransition: true,
    maxAttachments: 2,
    allowedAspectRatios: ["16:9", "9:16", "1:1"],
    allowedDurations: [8],
    allowedResolutions: ["720p", "1080p"],
    showResolutionSelector: true,
    supportsAudio: true,
    defaultAudioOn: true,
    baseCreditCost: 108,
    isQueued: true,
    provider: "fal",
  },
  // Kling family
  {
    id: "vid-kling-2.6-pro",
    label: "Kling 2.6 Pro",
    company: "Kling",
    description: "Latest Kling model with enhanced quality",
    logo: "kling",
    isNew: true,
    requiresAttachment: false,
    isTransition: false,
    supportsAttachment: true,
    maxAttachments: 1,
    // No image: ["16:9", "9:16", "1:1"], with image: hide AR selector
    allowedAspectRatios: ["16:9", "9:16", "1:1"],
    allowedDurations: [5, 10],
    hideAspectRatioWithImage: true,
    supportsAudio: true, // Show generateAudio toggle
    baseCreditCost: 40,
    isQueued: true,
    provider: "kie",
  },
  {
    id: "vid-kling-2.5-pro",
    label: "Kling 2.5 Pro",
    company: "Kling",
    description: "High-quality video generation",
    logo: "kling",
    isNew: true,
    requiresAttachment: false,
    isTransition: false,
    supportsAttachment: true,
    maxAttachments: 1,
    // Always show ["16:9", "9:16", "1:1"] even with image
    allowedAspectRatios: ["16:9", "9:16", "1:1"],
    allowedDurations: [5, 10],
    supportsAudio: false, // No audio toggle
    baseCreditCost: 40,
    isQueued: true,
    provider: "kie",
  },
  {
    id: "kling-2.5-turbo-transition",
    label: "Kling 2.5 Pro Transition",
    company: "Kling",
    description: "Smooth transitions between two images",
    logo: "kling",
    isNew: true,
    requiresAttachment: true,
    isTransition: true,
    maxAttachments: 2,
    allowedAspectRatios: ["16:9", "9:16", "1:1"],
    allowedDurations: [5, 10],
    supportsAudio: false,
    baseCreditCost: 40,
    isQueued: true,
    provider: "kie",
  },
  {
    id: "kling-o1",
    label: "Kling O1 Edit",
    company: "Kling",
    description: "Advanced reference-based video (images, elements, video refs)",
    logo: "kling",
    isNew: true,
    requiresAttachment: true,
    isTransition: false,
    maxAttachments: 10, // Up to 10 refs (images + elements + video)
    allowedAspectRatios: ["16:9", "9:16", "1:1"],
    allowedDurations: [5, 10],
    supportsAudio: false,
    baseCreditCost: 35,
    isQueued: true,
    provider: "kie",
  },
  {
    id: "kling-o1-transition",
    label: "Kling O1 Transition",
    company: "Kling",
    description: "Kling O1 with start frame (end frame optional)",
    logo: "kling",
    isNew: true,
    requiresAttachment: true,
    isTransition: true, // Requires startFrameImageUrl, endFrameImageUrl optional
    maxAttachments: 2,
    allowedAspectRatios: ["16:9", "9:16", "1:1"],
    allowedDurations: [5, 10],
    supportsAudio: false,
    baseCreditCost: 35,
    isQueued: true,
    provider: "kie",
  },
  // Sora
  {
    id: "kie-sora-2",
    label: "Sora 2",
    company: "OpenAI",
    description: "OpenAI's cutting-edge video generation model",
    logo: "openai",
    isNew: true,
    requiresAttachment: false,
    isTransition: false,
    supportsAttachment: true,
    maxAttachments: 1,
    // ["16:9", "9:16"] for both text and image modes
    allowedAspectRatios: ["16:9", "9:16"],
    allowedDurations: [10, 15], // Sora 2 supports 10s and 15s
    // No resolution dropdown (fixed ~720p)
    supportsAudio: false, // No audio toggle
    supportsWatermarkToggle: true,
    baseCreditCost: 30,
    isQueued: true,
    provider: "kie",
  },
  // Ovi
  {
    id: "vid-ovi",
    label: "Ovi",
    company: "Ovi",
    description: "Unified audio-video generation with sound",
    logo: "ovi",
    isNew: true,
    requiresAttachment: false,
    isTransition: false,
    supportsAttachment: true,
    maxAttachments: 1,
    // Text-only: full AR set, with image: hide AR selector
    allowedAspectRatios: ["16:9", "9:16", "1:1", "4:3", "3:4"],
    allowedDurations: [5], // Fixed 5s
    hideAspectRatioWithImage: true,
    // Implicit audio (no toggle), fixed resolution
    supportsAudio: false, // Implicit audio, no toggle needed
    baseCreditCost: 21,
    isQueued: true,
    provider: "fal",
  },
  // Wan family
  {
    id: "kie-wan-2.5",
    label: "Wan 2.5",
    company: "Alibaba",
    description: "High-quality text/image-to-video with native audio",
    logo: "alibaba",
    isNew: false,
    requiresAttachment: false,
    isTransition: false,
    supportsAttachment: true,
    maxAttachments: 1,
    // Text-only: ["16:9", "9:16", "1:1"], with image: hide AR
    allowedAspectRatios: ["16:9", "9:16", "1:1"],
    allowedDurations: [5, 10],
    allowedResolutions: ["720p", "1080p"],
    showResolutionSelector: true,
    hideAspectRatioWithImage: true,
    // Always-on audio indicator (no toggle)
    supportsAudio: false, // Native audio, no toggle
    baseCreditCost: 15,
    isQueued: true,
    provider: "kie",
  },
  // MiniMax Hailuo
  {
    id: "vid-hailuo-2.3-pro",
    label: "Hailuo 2.3 Pro",
    company: "MiniMax",
    description: "Advanced 1080p video generation",
    logo: "minimax",
    isNew: true,
    requiresAttachment: false,
    isTransition: false,
    supportsAttachment: true,
    maxAttachments: 1,
    allowedAspectRatios: ["1:1"], // Hailuo 2.3 Pro generates square videos
    hideAspectRatio: true,
    allowedDurations: [5], // Only 5s supported
    // Resolution hidden, fixed 1080p
    supportsAudio: false,
    baseCreditCost: 49,
    isQueued: true,
    provider: "fal",
  },
  {
    id: "vid-hailuo-2.3",
    label: "Hailuo 2.3 Standard",
    company: "MiniMax",
    description: "High-quality video generation",
    logo: "minimax",
    isNew: true,
    requiresAttachment: false,
    isTransition: false,
    supportsAttachment: true,
    maxAttachments: 1,
    allowedAspectRatios: ["1:1"], // Hailuo 2.3 generates square videos
    hideAspectRatio: true,
    allowedDurations: [6, 10], // 6s and 10s supported
    // Resolution hidden, fixed 720p
    supportsAudio: false,
    baseCreditCost: 30,
    isQueued: true,
    provider: "fal",
  },
  // Kandinsky
  {
    id: "vid-kandinsky-5",
    label: "Kandinsky 5",
    company: "Sber",
    description: "Fast, high-quality text-to-video",
    logo: "sber",
    isNew: true,
    requiresAttachment: false,
    isTransition: false,
    isTextOnly: true, // No attachments allowed
    allowedAspectRatios: ["16:9", "9:16", "1:1"],
    allowedDurations: [5, 10],
    allowedResolutions: ["720p", "1080p"],
    showResolutionSelector: true,
    supportsAudio: false,
    baseCreditCost: 12,
    isQueued: true,
    provider: "fal",
  },
  // Seedance family (Fal)
  {
    id: "vid-seedance-lite",
    label: "Seedance Lite",
    company: "ByteDance",
    description: "Fast video generation",
    logo: "bytedance-color",
    isNew: true,
    requiresAttachment: false,
    isTransition: false,
    supportsAttachment: true,
    maxAttachments: 1,
    // Full AR set for Seedance
    allowedAspectRatios: ["16:9", "9:16", "1:1", "4:3", "3:4"],
    allowedDurations: [5, 8, 12],
    allowedResolutions: ["480p", "720p", "1080p"],
    showResolutionSelector: true,
    supportsAudio: false, // No audio toggle
    supportsCameraFixed: true,
    baseCreditCost: 21,
    isQueued: true,
    provider: "fal",
  },
  {
    id: "vid-seedance-pro",
    label: "Seedance Pro",
    company: "ByteDance",
    description: "High-quality video generation",
    logo: "bytedance-color",
    isNew: true,
    requiresAttachment: false,
    isTransition: false,
    supportsAttachment: true,
    maxAttachments: 1,
    allowedAspectRatios: ["16:9", "9:16", "1:1", "4:3", "3:4"],
    allowedDurations: [5, 8, 12],
    allowedResolutions: ["480p", "720p", "1080p"],
    showResolutionSelector: true,
    supportsAudio: false,
    supportsCameraFixed: true,
    baseCreditCost: 34,
    isQueued: true,
    provider: "fal",
  },
  {
    id: "seedance-pro-transition",
    label: "Seedance Pro Transition",
    company: "ByteDance",
    description: "Smooth transitions between two images",
    logo: "bytedance-color",
    isNew: true,
    requiresAttachment: true,
    isTransition: true,
    maxAttachments: 2,
    allowedAspectRatios: ["16:9", "9:16", "1:1", "4:3", "3:4"],
    allowedDurations: [5, 8, 12],
    allowedResolutions: ["480p", "720p", "1080p"],
    showResolutionSelector: true,
    supportsAudio: false,
    supportsCameraFixed: true,
    baseCreditCost: 34,
    isQueued: true,
    provider: "fal",
  },
  // Seedance family (KIE)
  {
    id: "kie-seedance-1.5-pro",
    label: "Seedance 1.5 Pro",
    company: "ByteDance",
    description: "KIE-based Seedance with enhanced quality",
    logo: "bytedance-color",
    isNew: true,
    requiresAttachment: false,
    isTransition: false,
    supportsAttachment: true,
    maxAttachments: 1,
    // Full AR set
    allowedAspectRatios: ["16:9", "9:16", "1:1", "4:3", "3:4"],
    allowedDurations: [4, 8, 12],
    allowedResolutions: ["480p", "720p"],
    showResolutionSelector: true,
    supportsAudio: true, // Show generateAudio toggle
    supportsCameraFixed: true,
    baseCreditCost: 34,
    isQueued: true,
    provider: "kie",
  },
  {
    id: "kie-seedance-1.5-pro-transition",
    label: "Seedance 1.5 Pro Transition",
    company: "ByteDance",
    description: "KIE-based Seedance 2-frame transitions",
    logo: "bytedance-color",
    isNew: true,
    requiresAttachment: true,
    isTransition: true,
    maxAttachments: 2,
    allowedAspectRatios: ["16:9", "9:16", "1:1", "4:3", "3:4"],
    allowedDurations: [4, 8, 12],
    allowedResolutions: ["480p", "720p"],
    showResolutionSelector: true,
    supportsAudio: true, // Show generateAudio toggle
    supportsCameraFixed: true,
    baseCreditCost: 34,
    isQueued: true,
    provider: "kie",
  },
  // Pixverse
  {
    id: "pixverse-v5",
    label: "Pixverse v5",
    company: "Pixverse",
    description: "High-quality text/image-to-video",
    logo: "pixverse",
    isNew: false,
    requiresAttachment: false,
    isTransition: false,
    supportsAttachment: true,
    maxAttachments: 1,
    allowedAspectRatios: ["16:9", "4:3", "1:1", "3:4", "9:16"],
    // Duration depends on resolution: 1080p = [5] only, otherwise [5, 8]
    allowedDurations: [5, 8],
    allowedResolutions: ["360p", "540p", "720p", "1080p"],
    showResolutionSelector: true,
    supportsAudio: false, // No audio toggle
    baseCreditCost: 16,
    isQueued: true,
    provider: "fal",
  },
  {
    id: "pixverse-v5-transition",
    label: "Pixverse v5 Transition",
    company: "Pixverse",
    description: "2-frame transitions",
    logo: "pixverse",
    isNew: false,
    requiresAttachment: true,
    isTransition: true,
    maxAttachments: 2,
    allowedAspectRatios: ["16:9", "4:3", "1:1", "3:4", "9:16"],
    allowedDurations: [5, 8], // 1080p: [5] only
    allowedResolutions: ["360p", "540p", "720p", "1080p"],
    showResolutionSelector: true,
    supportsAudio: false,
    baseCreditCost: 16,
    isQueued: true,
    provider: "fal",
  },
  // Lucy (Decart) - Image-to-video only
  {
    id: "vid-lucy-lite",
    label: "Lucy Lite",
    company: "Decart",
    description: "Fast 3s image-to-video (requires image)",
    logo: "decart",
    isNew: false,
    requiresAttachment: true, // Must have image
    isTransition: false,
    isImageOnly: true, // Generation disabled without image
    maxAttachments: 1,
    allowedAspectRatios: ["16:9", "9:16"],
    allowedDurations: [5], // Fixed 3s but using 5 for type safety
    allowedResolutions: ["720p"], // Fixed 720p
    supportsAudio: false,
    baseCreditCost: 16,
    isQueued: true,
    provider: "fal",
  },
  {
    id: "vid-lucy-pro",
    label: "Lucy Pro",
    company: "Decart",
    description: "High-quality 5s image-to-video (requires image)",
    logo: "decart",
    isNew: false,
    requiresAttachment: true, // Must have image
    isTransition: false,
    isImageOnly: true, // Generation disabled without image
    maxAttachments: 1,
    allowedAspectRatios: ["16:9", "9:16"],
    allowedDurations: [5],
    allowedResolutions: ["720p", "1080p"],
    showResolutionSelector: true,
    supportsAudio: false,
    baseCreditCost: 32,
    isQueued: true,
    provider: "fal",
  },
];

// Helper to get model by ID
export function getVideoModelById(id: VideoModelId): VideoModelMeta | undefined {
  return VIDEO_MODELS.find((m) => m.id === id);
}

// Helper to get model by label
export function getVideoModelByLabel(label: string): VideoModelMeta | undefined {
  return VIDEO_MODELS.find((m) => m.label === label);
}

// Helper to check if model requires attachments
export function videoModelRequiresAttachment(id: VideoModelId): boolean {
  const model = getVideoModelById(id);
  return model?.requiresAttachment ?? false;
}

// Helper to check if model is a transition model
export function isTransitionModel(id: VideoModelId): boolean {
  const model = getVideoModelById(id);
  return model?.isTransition ?? false;
}

// Helper to get allowed aspect ratios for model
export function getVideoModelAspectRatios(id: VideoModelId): VideoAspectRatio[] {
  const model = getVideoModelById(id);
  return model?.allowedAspectRatios ?? DEFAULT_VIDEO_ASPECT_RATIOS;
}

// Helper to get allowed durations for model
export function getVideoModelDurations(id: VideoModelId): VideoDuration[] {
  const model = getVideoModelById(id);
  return model?.allowedDurations ?? [5];
}

// Helper to get allowed resolutions for model
export function getVideoModelResolutions(id: VideoModelId): VideoResolution[] {
  const model = getVideoModelById(id);
  return model?.allowedResolutions ?? ["720p"];
}

// Calculate video cost (matches web's calculateVideoCost)
export function calculateVideoCost(
  modelId: VideoModelId,
  options?: {
    resolution?: VideoResolution;
    hasAudio?: boolean;
    duration?: VideoDuration;
    fastMode?: boolean;
    removeWatermark?: boolean;
  }
): number {
  const model = getVideoModelById(modelId);
  if (!model) return 50; // Default fallback

  let cost = model.baseCreditCost;

  // Resolution multiplier
  if (options?.resolution === "1080p") {
    cost = Math.ceil(cost * 1.5);
  }

  // Audio adds cost for models that support it
  if (options?.hasAudio && model.supportsAudio) {
    cost = Math.ceil(cost * 1.2);
  }

  // Longer duration adds cost
  if (options?.duration && options.duration > 5) {
    cost = Math.ceil(cost * (options.duration / 5));
  }

  // Fast mode reduces cost
  if (options?.fastMode && model.supportsFastMode) {
    cost = Math.ceil(cost * 0.7);
  }

  // Watermark removal adds cost (Sora 2)
  if (options?.removeWatermark && model.supportsWatermarkToggle) {
    cost = Math.ceil(cost * 1.3);
  }

  return cost;
}

// Check if model supports audio
export function videoModelSupportsAudio(id: VideoModelId): boolean {
  const model = getVideoModelById(id);
  return model?.supportsAudio ?? false;
}

// Check if model supports fast mode
export function videoModelSupportsFastMode(id: VideoModelId): boolean {
  const model = getVideoModelById(id);
  return model?.supportsFastMode ?? false;
}

// Check if model supports watermark toggle
export function videoModelSupportsWatermarkToggle(id: VideoModelId): boolean {
  const model = getVideoModelById(id);
  return model?.supportsWatermarkToggle ?? false;
}

// Check if attachments are optional for this model
export function videoModelSupportsOptionalAttachment(id: VideoModelId): boolean {
  const model = getVideoModelById(id);
  return model?.supportsAttachment ?? false;
}

// Get max attachments for model
export function getVideoMaxAttachments(id: VideoModelId): number {
  const model = getVideoModelById(id);
  return model?.maxAttachments ?? 1;
}

// Check if model is text-only (no attachments allowed)
export function isTextOnlyModel(id: VideoModelId): boolean {
  const model = getVideoModelById(id);
  return model?.isTextOnly ?? false;
}

// Check if model is image-only (requires attachment to generate)
export function isImageOnlyModel(id: VideoModelId): boolean {
  const model = getVideoModelById(id);
  return model?.isImageOnly ?? false;
}

// Check if model supports camera fixed toggle
export function videoModelSupportsCameraFixed(id: VideoModelId): boolean {
  const model = getVideoModelById(id);
  return model?.supportsCameraFixed ?? false;
}

// Check if resolution selector should be shown
export function shouldShowResolutionSelector(id: VideoModelId): boolean {
  const model = getVideoModelById(id);
  return model?.showResolutionSelector ?? false;
}

// Check if AR selector should be hidden when image is attached
export function shouldHideAspectRatioWithImage(id: VideoModelId): boolean {
  const model = getVideoModelById(id);
  return model?.hideAspectRatioWithImage ?? false;
}

// Get dynamic aspect ratios based on attachment state
export function getDynamicAspectRatios(
  id: VideoModelId,
  hasImageAttached: boolean
): VideoAspectRatio[] {
  const model = getVideoModelById(id);
  if (!model) return ["16:9", "9:16", "1:1"];

  // If image attached and model has specific AR for that
  if (hasImageAttached && model.imageAttachedAspectRatios) {
    return model.imageAttachedAspectRatios;
  }

  return model.allowedAspectRatios;
}

// Get dynamic durations based on attachment state and resolution
export function getDynamicDurations(
  id: VideoModelId,
  hasImageAttached: boolean,
  resolution?: VideoResolution
): VideoDuration[] {
  const model = getVideoModelById(id);
  if (!model) return [5];

  // Veo: with image attached, only [8] allowed
  if (hasImageAttached && model.imageAttachedDurations) {
    return model.imageAttachedDurations;
  }

  // Pixverse: 1080p only allows [5]
  if ((id === "pixverse-v5" || id === "pixverse-v5-transition") && resolution === "1080p") {
    return [5];
  }

  return model.allowedDurations;
}

// Get UI constraints for a model (all-in-one helper)
export function getVideoModelUIConstraints(
  id: VideoModelId,
  hasImageAttached: boolean,
  resolution?: VideoResolution
): {
  aspectRatios: VideoAspectRatio[];
  durations: VideoDuration[];
  resolutions: VideoResolution[];
  showResolution: boolean;
  showAspectRatio: boolean;
  showAudio: boolean;
  showCameraFixed: boolean;
  showWatermarkToggle: boolean;
  canAttachImage: boolean;
  requiresImage: boolean;
  isTransition: boolean;
} {
  const model = getVideoModelById(id);
  if (!model) {
    return {
      aspectRatios: ["16:9", "9:16", "1:1"],
      durations: [5],
      resolutions: ["720p"],
      showResolution: false,
      showAspectRatio: true,
      showAudio: false,
      showCameraFixed: false,
      showWatermarkToggle: false,
      canAttachImage: true,
      requiresImage: false,
      isTransition: false,
    };
  }

  // Determine if AR selector should be shown
  const hideAR = model.hideAspectRatio || (hasImageAttached && model.hideAspectRatioWithImage);

  return {
    aspectRatios: getDynamicAspectRatios(id, hasImageAttached),
    durations: getDynamicDurations(id, hasImageAttached, resolution),
    resolutions: model.allowedResolutions ?? ["720p"],
    showResolution: model.showResolutionSelector ?? false,
    showAspectRatio: !hideAR,
    showAudio: model.supportsAudio ?? false,
    showCameraFixed: model.supportsCameraFixed ?? false,
    showWatermarkToggle: model.supportsWatermarkToggle ?? false,
    canAttachImage: !model.isTextOnly && (model.supportsAttachment || model.requiresAttachment),
    requiresImage: model.requiresAttachment || model.isImageOnly === true,
    isTransition: model.isTransition ?? false,
  };
}

// Validate attachments for video model
export function validateVideoAttachments(
  id: VideoModelId,
  attachmentCount: number
): { valid: boolean; message?: string } {
  const model = getVideoModelById(id);
  if (!model) {
    return { valid: false, message: "Unknown model" };
  }

  if (model.requiresAttachment && attachmentCount === 0) {
    if (model.isTransition) {
      return {
        valid: false,
        message: `${model.label} requires start and end frame images`,
      };
    }
    return {
      valid: false,
      message: `${model.label} requires at least one image`,
    };
  }

  if (model.isTransition && attachmentCount !== 2) {
    return {
      valid: false,
      message: `${model.label} requires exactly 2 images (start and end frames)`,
    };
  }

  if (model.maxAttachments && attachmentCount > model.maxAttachments) {
    return {
      valid: false,
      message: `${model.label} supports up to ${model.maxAttachments} image(s)`,
    };
  }

  return { valid: true };
}

// Priority models that should appear at the top (in order)
const PRIORITY_VIDEO_MODEL_IDS: VideoModelId[] = ["vid-veo-3.1", "kie-sora-2"];

// Get display-friendly models (sorted: priority first, then new, then alphabetical)
export function getSortedVideoModels(): VideoModelMeta[] {
  return [...VIDEO_MODELS].sort((a, b) => {
    // Priority models first (in specified order)
    const aPriority = PRIORITY_VIDEO_MODEL_IDS.indexOf(a.id);
    const bPriority = PRIORITY_VIDEO_MODEL_IDS.indexOf(b.id);
    if (aPriority !== -1 && bPriority !== -1) return aPriority - bPriority;
    if (aPriority !== -1) return -1;
    if (bPriority !== -1) return 1;
    // New models next
    if (a.isNew !== b.isNew) return a.isNew ? -1 : 1;
    // Then alphabetical by label
    return a.label.localeCompare(b.label);
  });
}

// Get only text-to-video models (no attachment required)
export function getTextToVideoModels(): VideoModelMeta[] {
  return VIDEO_MODELS.filter((m) => !m.requiresAttachment);
}

// Get only image-to-video models (attachment required, not transitions)
export function getImageToVideoModels(): VideoModelMeta[] {
  return VIDEO_MODELS.filter((m) => m.requiresAttachment && !m.isTransition);
}

// Get only transition models
export function getTransitionModels(): VideoModelMeta[] {
  return VIDEO_MODELS.filter((m) => m.isTransition);
}

// Check if model is Kling O1 video (needs @Image mentions)
export function isKlingO1VideoModel(id: VideoModelId): boolean {
  return id === "kling-o1" || id === "kling-o1-transition";
}

// Polling configuration for video (longer than images)
export const VIDEO_POLLING_CONFIG = {
  initialDelay: 2000, // 2 seconds
  maxDelay: 15000, // 15 seconds
  backoffMultiplier: 1.5,
  maxAttempts: 180, // 5+ minutes max polling (videos take longer)
  timeout: 300000, // 5 minute timeout
};

// Default video generation settings
export const DEFAULT_VIDEO_SETTINGS = {
  modelId: "vid-veo-3.1" as VideoModelId,
  aspectRatio: "16:9" as VideoAspectRatio,
  duration: 5 as VideoDuration,
  resolution: "720p" as VideoResolution,
  generateAudio: true,
  fastMode: false,
  removeWatermark: false,
};

// Video model IDs enum for easy reference
export const VIDEO_MODEL_IDS = {
  // Veo 3.1 family
  VEO_3_1: "vid-veo-3.1" as VideoModelId,
  VEO_3_1_FAST: "vid-veo-3.1-fast" as VideoModelId,
  VEO_3_1_TRANSITION: "veo3.1-transition" as VideoModelId,
  VEO_3_1_FAST_TRANSITION: "veo3.1-fast-transition" as VideoModelId,
  // Kling family
  KLING_2_6_PRO: "vid-kling-2.6-pro" as VideoModelId,
  KLING_2_5_PRO: "vid-kling-2.5-pro" as VideoModelId,
  KLING_2_5_TURBO_TRANSITION: "kling-2.5-turbo-transition" as VideoModelId,
  KLING_O1: "kling-o1" as VideoModelId,
  KLING_O1_TRANSITION: "kling-o1-transition" as VideoModelId,
  // Sora
  SORA_2: "kie-sora-2" as VideoModelId,
  // Ovi
  OVI: "vid-ovi" as VideoModelId,
  // Wan family
  WAN_2_5: "kie-wan-2.5" as VideoModelId,
  // MiniMax Hailuo
  HAILUO_2_3_PRO: "vid-hailuo-2.3-pro" as VideoModelId,
  HAILUO_2_3: "vid-hailuo-2.3" as VideoModelId,
  // Kandinsky
  KANDINSKY_5: "vid-kandinsky-5" as VideoModelId,
  // Seedance family
  SEEDANCE_LITE: "vid-seedance-lite" as VideoModelId,
  SEEDANCE_PRO: "vid-seedance-pro" as VideoModelId,
  SEEDANCE_PRO_TRANSITION: "seedance-pro-transition" as VideoModelId,
  SEEDANCE_1_5_PRO: "kie-seedance-1.5-pro" as VideoModelId,
  SEEDANCE_1_5_PRO_TRANSITION: "kie-seedance-1.5-pro-transition" as VideoModelId,
  // Pixverse
  PIXVERSE_V5: "pixverse-v5" as VideoModelId,
  PIXVERSE_V5_TRANSITION: "pixverse-v5-transition" as VideoModelId,
  // Lucy (Decart)
  LUCY_LITE: "vid-lucy-lite" as VideoModelId,
  LUCY_PRO: "vid-lucy-pro" as VideoModelId,
} as const;
