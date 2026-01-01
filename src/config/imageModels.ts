/**
 * Shared Image Models Registry
 * Single source of truth for all image model IDs, metadata, and constraints
 * Mirrors web's image-prompt-bar.tsx and model-ids.ts
 */

// Model ID type for type safety
export type ImageModelId =
  | "img-imagen4-preview"
  | "img-imagen3"
  | "img-nano-banana"
  | "img-nano-banana-edit"
  | "img-nano-banana-pro"
  | "img-nano-banana-pro-edit"
  | "img-seedream-v4"
  | "img-seedream-v4-edit"
  | "img-seedream-v45"
  | "img-seedream-v45-edit"
  | "img-gpt-image-1-5"
  | "img-gpt-image-1-5-edit"
  | "img-hunyuan-v21"
  | "img-wan-v22-a14b"
  | "img-reve"
  | "img-reve-edit"
  | "img-kling-o1"
  | "img-flux-2-max"
  | "img-flux-2-max-edit";

// Aspect ratio type
export type AspectRatio =
  | "21:9"
  | "1:1"
  | "16:9"
  | "9:16"
  | "3:4"
  | "4:3"
  | "3:2"
  | "2:3"
  | "5:4"
  | "4:5";

// Resolution type for models that support it
export type Resolution = "1K" | "2K" | "4K";

// Quality type for GPT-Image 1.5
export type Quality = "medium" | "high";

// Valid aspect ratios from web's shared.ts
export const VALID_ASPECT_RATIOS: AspectRatio[] = [
  "21:9",
  "1:1",
  "16:9",
  "9:16",
  "3:4",
  "4:3",
  "3:2",
  "2:3",
  "5:4",
  "4:5",
];

// Default aspect ratios (most models)
export const DEFAULT_ASPECT_RATIOS: AspectRatio[] = [
  "1:1",
  "4:3",
  "3:4",
  "16:9",
  "9:16",
];

// Full aspect ratios (Nano Banana family)
export const FULL_ASPECT_RATIOS: AspectRatio[] = [
  "21:9",
  "1:1",
  "4:3",
  "3:2",
  "2:3",
  "5:4",
  "4:5",
  "3:4",
  "16:9",
  "9:16",
];

// Restricted aspect ratios (GPT/Azure + GPT-1.5)
export const RESTRICTED_ASPECT_RATIOS: AspectRatio[] = ["1:1", "4:3", "3:4"];

// Kling O1 aspect ratios
export const KLING_O1_ASPECT_RATIOS: AspectRatio[] = [
  "16:9",
  "9:16",
  "1:1",
  "4:3",
  "3:4",
  "3:2",
  "2:3",
  "21:9",
];

// Legacy aliases for compatibility
export const STANDARD_ASPECT_RATIOS = DEFAULT_ASPECT_RATIOS;
export const GPT_ASPECT_RATIOS = RESTRICTED_ASPECT_RATIOS;

// Resolution options type
export type ResolutionOptions = "1K_2K_4K" | "1K_2K" | null;

// Image model metadata
export interface ImageModelMeta {
  id: ImageModelId;
  label: string;
  company: string;
  description: string;
  logo: string; // Asset path for mobile
  isNew: boolean;
  requiresAttachment: boolean;
  minAttachments?: number;
  maxAttachments?: number;
  allowedAspectRatios: AspectRatio[];
  aspectRatioDisabled?: boolean; // If true, hide aspect ratio selector
  attachmentDisabled?: boolean; // If true, hide the + button (no attachments allowed)
  supportsResolution?: boolean;
  resolutionOptions?: ResolutionOptions; // Which resolution options to show
  supportsQuality?: boolean;
  maxImages: number;
  creditCost: number;
  isQueued: boolean; // Whether this model uses queued polling
  // Unified model: switches to editModelId when attachments are present
  editModelId?: ImageModelId;
  isEditVariant?: boolean; // True for edit models that should be hidden from UI
}

// Complete model registry
export const IMAGE_MODELS: ImageModelMeta[] = [
  // New models (isNew: true)
  {
    id: "img-nano-banana-pro",
    label: "Nano Banana Pro",
    company: "Google",
    description: "Google's new state-of-the-art image generation model (1K/2K/4K)",
    logo: "googleg",
    isNew: true,
    requiresAttachment: false,
    maxAttachments: 10,
    allowedAspectRatios: FULL_ASPECT_RATIOS,
    supportsResolution: true,
    resolutionOptions: "1K_2K_4K",
    maxImages: 4,
    creditCost: 15,
    isQueued: true,
    editModelId: "img-nano-banana-pro-edit",
  },
  {
    id: "img-nano-banana-pro-edit",
    label: "Nano Banana Pro Edit",
    company: "Google",
    description: "Google's new state-of-the-art image editing model (1K/2K/4K)",
    logo: "googleg",
    isNew: true,
    requiresAttachment: true,
    minAttachments: 1,
    maxAttachments: 10,
    allowedAspectRatios: FULL_ASPECT_RATIOS,
    supportsResolution: true,
    resolutionOptions: "1K_2K_4K",
    maxImages: 4,
    creditCost: 15,
    isQueued: true,
    isEditVariant: true,
  },
  {
    id: "img-gpt-image-1-5",
    label: "GPT-Image 1.5",
    company: "OpenAI",
    description: "OpenAI's latest image generation with quality tiers",
    logo: "openai",
    isNew: true,
    requiresAttachment: false,
    maxAttachments: 10,
    allowedAspectRatios: RESTRICTED_ASPECT_RATIOS,
    supportsQuality: true,
    maxImages: 4,
    creditCost: 4,
    isQueued: true,
    editModelId: "img-gpt-image-1-5-edit",
  },
  {
    id: "img-gpt-image-1-5-edit",
    label: "GPT-Image 1.5 Edit",
    company: "OpenAI",
    description: "OpenAI's latest image editing with quality tiers",
    logo: "openai",
    isNew: true,
    requiresAttachment: true,
    minAttachments: 1,
    maxAttachments: 10,
    allowedAspectRatios: RESTRICTED_ASPECT_RATIOS,
    supportsQuality: true,
    maxImages: 4,
    creditCost: 4,
    isQueued: true,
    isEditVariant: true,
  },
  {
    id: "img-flux-2-max",
    label: "Flux 2 Max",
    company: "FLUX",
    description:
      "State-of-the-art image generation with exceptional realism and precision",
    logo: "flux",
    isNew: true,
    requiresAttachment: false,
    maxAttachments: 10,
    allowedAspectRatios: DEFAULT_ASPECT_RATIOS,
    maxImages: 4,
    creditCost: 7,
    isQueued: true,
    editModelId: "img-flux-2-max-edit",
  },
  {
    id: "img-flux-2-max-edit",
    label: "Flux 2 Max Edit",
    company: "FLUX",
    description: "Advanced Flux 2 Max editing with up to 10 reference images",
    logo: "flux",
    isNew: true,
    requiresAttachment: true,
    minAttachments: 1,
    maxAttachments: 10,
    allowedAspectRatios: DEFAULT_ASPECT_RATIOS,
    maxImages: 4,
    creditCost: 7,
    isQueued: true,
    isEditVariant: true,
  },
  {
    id: "img-kling-o1",
    label: "Kling O1 Image Edit",
    company: "Kling",
    description:
      "Advanced image editing with @Image1, @Image2 references (up to 10 images)",
    logo: "kling",
    isNew: true,
    requiresAttachment: true,
    minAttachments: 1,
    maxAttachments: 10,
    allowedAspectRatios: KLING_O1_ASPECT_RATIOS,
    supportsResolution: true,
    resolutionOptions: "1K_2K",
    maxImages: 4,
    creditCost: 3,
    isQueued: true,
  },
  {
    id: "img-seedream-v45",
    label: "Seedream v4.5",
    company: "ByteDance",
    description: "Latest generation with unified architecture for image creation",
    logo: "bytedance-color",
    isNew: true,
    requiresAttachment: false,
    maxAttachments: 10,
    allowedAspectRatios: DEFAULT_ASPECT_RATIOS,
    maxImages: 4,
    creditCost: 3,
    isQueued: true,
    editModelId: "img-seedream-v45-edit",
  },
  {
    id: "img-seedream-v45-edit",
    label: "Seedream v4.5 Edit",
    company: "ByteDance",
    description: "Advanced multi-image editing with up to 10 reference images",
    logo: "bytedance-color",
    isNew: true,
    requiresAttachment: true,
    minAttachments: 1,
    maxAttachments: 10,
    allowedAspectRatios: DEFAULT_ASPECT_RATIOS,
    maxImages: 4,
    creditCost: 3,
    isQueued: true,
    isEditVariant: true,
  },
  // Standard models (isNew: false)
  {
    id: "img-nano-banana",
    label: "Nano Banana",
    company: "Google",
    description: "Fast text-to-image generation with aspect ratio control",
    logo: "googleg",
    isNew: false,
    requiresAttachment: false,
    maxAttachments: 10,
    allowedAspectRatios: FULL_ASPECT_RATIOS,
    maxImages: 4,
    creditCost: 3,
    isQueued: true,
    editModelId: "img-nano-banana-edit",
  },
  {
    id: "img-nano-banana-edit",
    label: "Nano Banana Edit",
    company: "Google",
    description: "Advanced image editing with aspect ratio control",
    logo: "googleg",
    isNew: false,
    requiresAttachment: true,
    minAttachments: 1,
    maxAttachments: 10,
    allowedAspectRatios: FULL_ASPECT_RATIOS,
    maxImages: 4,
    creditCost: 3,
    isQueued: true,
    isEditVariant: true,
  },
  {
    id: "img-imagen4-preview",
    label: "Imagen 4",
    company: "Google",
    description: "Standard quality, faster generation",
    logo: "googleg",
    isNew: false,
    requiresAttachment: false,
    attachmentDisabled: true,
    allowedAspectRatios: DEFAULT_ASPECT_RATIOS,
    maxImages: 4,
    creditCost: 3,
    isQueued: false, // sync model
  },
  {
    id: "img-imagen3",
    label: "Imagen 3",
    company: "Google",
    description: "Google's most realistic image generation model",
    logo: "googleg",
    isNew: false,
    requiresAttachment: false,
    attachmentDisabled: true,
    allowedAspectRatios: DEFAULT_ASPECT_RATIOS,
    maxImages: 4,
    creditCost: 3,
    isQueued: true, // Wavespeed queued
  },
  {
    id: "img-reve",
    label: "Reve",
    company: "Reve",
    description:
      "Detailed visual output with strong aesthetic quality and accurate text rendering",
    logo: "donereve",
    isNew: false,
    requiresAttachment: false,
    maxAttachments: 1,
    allowedAspectRatios: STANDARD_ASPECT_RATIOS,
    maxImages: 4,
    creditCost: 3,
    isQueued: false, // sync model
    editModelId: "img-reve-edit",
  },
  {
    id: "img-reve-edit",
    label: "Reve Edit",
    company: "Reve",
    description: "Edit and transform images with text prompts",
    logo: "donereve",
    isNew: false,
    requiresAttachment: true,
    minAttachments: 1,
    maxAttachments: 1,
    allowedAspectRatios: STANDARD_ASPECT_RATIOS,
    maxImages: 4,
    creditCost: 3,
    isQueued: false, // sync model
    isEditVariant: true,
  },
  {
    id: "img-seedream-v4",
    label: "Seedream v4",
    company: "ByteDance",
    description: "High-res 2K+ with strong text layout",
    logo: "bytedance-color",
    isNew: false,
    requiresAttachment: false,
    maxAttachments: 10,
    allowedAspectRatios: DEFAULT_ASPECT_RATIOS,
    maxImages: 4,
    creditCost: 3,
    isQueued: true,
    editModelId: "img-seedream-v4-edit",
  },
  {
    id: "img-seedream-v4-edit",
    label: "Seedream v4 Edit",
    company: "ByteDance",
    description: "Multi-image editing (up to 10 refs)",
    logo: "bytedance-color",
    isNew: false,
    requiresAttachment: true,
    minAttachments: 1,
    maxAttachments: 10,
    allowedAspectRatios: DEFAULT_ASPECT_RATIOS,
    maxImages: 4,
    creditCost: 3,
    isQueued: true,
    isEditVariant: true,
  },
];

// Helper to get model by ID
export function getModelById(id: ImageModelId): ImageModelMeta | undefined {
  return IMAGE_MODELS.find((m) => m.id === id);
}

// Helper to get model by label
export function getModelByLabel(label: string): ImageModelMeta | undefined {
  return IMAGE_MODELS.find((m) => m.label === label);
}

// Helper to check if model requires attachments
export function modelRequiresAttachment(id: ImageModelId): boolean {
  const model = getModelById(id);
  return model?.requiresAttachment ?? false;
}

// Helper to get allowed aspect ratios for model
export function getModelAspectRatios(id: ImageModelId): AspectRatio[] {
  const model = getModelById(id);
  return model?.allowedAspectRatios ?? VALID_ASPECT_RATIOS;
}

// Flux 2 Max aspect ratio to credits mapping (matches web)
export function getFlux2MaxCreditsPerImage(aspectRatio?: string): number {
  switch (aspectRatio) {
    case "1:1":
      return 7;
    case "3:4":
    case "4:3":
      return 8;
    case "9:16":
    case "16:9":
      return 9;
    default:
      return 7; // Default to square pricing
  }
}

// Helper to calculate credit cost (matches web calculateImageCost)
export function calculateImageCost(
  modelId: ImageModelId,
  numImages: number,
  options?: {
    resolution?: Resolution;
    quality?: Quality;
    aspectRatio?: AspectRatio;
  }
): number {
  const { resolution, quality, aspectRatio } = options ?? {};

  // GPT-Image 1.5 models have quality-based pricing
  if (modelId === "img-gpt-image-1-5" || modelId === "img-gpt-image-1-5-edit") {
    const creditsPerImage = quality === "high" ? 16 : 4; // high = 16, medium (default) = 4
    return creditsPerImage * numImages;
  }

  // Nano Banana Pro models have resolution-based pricing
  if (modelId === "img-nano-banana-pro" || modelId === "img-nano-banana-pro-edit") {
    const creditsPerImage = resolution === "4K" ? 25 : 15; // 4K = 25, 1K/2K = 15
    return creditsPerImage * numImages;
  }

  // Flux 2 Max models have aspect ratio-based pricing
  if (modelId === "img-flux-2-max" || modelId === "img-flux-2-max-edit") {
    const creditsPerImage = getFlux2MaxCreditsPerImage(aspectRatio);
    return creditsPerImage * numImages;
  }

  // Standard pricing for all other models (3 credits per image)
  return 3 * numImages;
}

// Check if model supports resolution setting
export function modelSupportsResolution(id: ImageModelId): boolean {
  const model = getModelById(id);
  return model?.supportsResolution ?? false;
}

// Check if model supports quality setting (GPT-Image 1.5)
export function modelSupportsQuality(id: ImageModelId): boolean {
  const model = getModelById(id);
  return model?.supportsQuality ?? false;
}

// Check if attachments are disabled for this model (hide + button)
export function isAttachmentDisabled(id: ImageModelId): boolean {
  const model = getModelById(id);
  return model?.attachmentDisabled ?? false;
}

// Check if aspect ratio selector should be hidden
export function isAspectRatioDisabled(id: ImageModelId): boolean {
  const model = getModelById(id);
  return model?.aspectRatioDisabled ?? false;
}

// Get resolution options for model (null if not supported)
export function getResolutionOptions(id: ImageModelId): Resolution[] | null {
  const model = getModelById(id);
  if (!model?.supportsResolution) return null;
  
  switch (model.resolutionOptions) {
    case "1K_2K_4K":
      return ["1K", "2K", "4K"];
    case "1K_2K":
      return ["1K", "2K"];
    default:
      return ["1K", "2K", "4K"]; // Default fallback
  }
}

// Get max images allowed for model
export function getMaxImages(id: ImageModelId): number {
  const model = getModelById(id);
  return model?.maxImages ?? 4;
}

// Validate attachments for model
export function validateAttachments(
  id: ImageModelId,
  attachmentCount: number
): { valid: boolean; message?: string } {
  const model = getModelById(id);
  if (!model) {
    return { valid: false, message: "Unknown model" };
  }

  if (model.requiresAttachment && attachmentCount === 0) {
    return {
      valid: false,
      message: `${model.label} requires at least ${model.minAttachments ?? 1} image(s)`,
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
const PRIORITY_MODEL_IDS: ImageModelId[] = ["img-nano-banana-pro"];

// Get display-friendly models (sorted: priority first, then new, then alphabetical)
// Filters out edit variants that are hidden from UI
export function getSortedModels(): ImageModelMeta[] {
  return [...IMAGE_MODELS]
    .filter((m) => !m.isEditVariant) // Hide edit variants from UI
    .sort((a, b) => {
      // Priority models first (in specified order)
      const aPriority = PRIORITY_MODEL_IDS.indexOf(a.id);
      const bPriority = PRIORITY_MODEL_IDS.indexOf(b.id);
      if (aPriority !== -1 && bPriority !== -1) return aPriority - bPriority;
      if (aPriority !== -1) return -1;
      if (bPriority !== -1) return 1;
      // New models next
      if (a.isNew !== b.isNew) return a.isNew ? -1 : 1;
      // Then alphabetical by label
      return a.label.localeCompare(b.label);
    });
}

// Get only text-to-image models (no attachment required)
export function getTextToImageModels(): ImageModelMeta[] {
  return IMAGE_MODELS.filter((m) => !m.requiresAttachment && !m.isEditVariant);
}

// Get only edit models (attachment required)
export function getEditModels(): ImageModelMeta[] {
  return IMAGE_MODELS.filter((m) => m.requiresAttachment);
}

// Get the effective model ID based on whether attachments are present
// For unified models, returns the edit model ID when attachments exist
export function getEffectiveModelId(
  id: ImageModelId,
  hasAttachments: boolean
): ImageModelId {
  const model = getModelById(id);
  if (!model) return id;
  
  // If model has an edit variant and user has attachments, use the edit model
  if (hasAttachments && model.editModelId) {
    return model.editModelId;
  }
  
  return id;
}

// Check if model is a unified model (has both text-to-image and edit capabilities)
export function isUnifiedModel(id: ImageModelId): boolean {
  const model = getModelById(id);
  return !!model?.editModelId;
}

// Polling configuration (matches web's polling-policy.ts)
export const POLLING_CONFIG = {
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 1.5,
  maxAttempts: 120, // 2 minutes max polling
  timeout: 120000, // 2 minute timeout
};

// Default generation settings
export const DEFAULT_SETTINGS = {
  modelId: "img-nano-banana" as ImageModelId,
  aspectRatio: "2:3" as AspectRatio,
  numImages: 1,
  resolution: "1K" as Resolution,
  quality: "medium" as Quality,
};

// Model IDs enum for easy reference (matches web's model-ids.ts)
export const IMAGE_MODEL_IDS = {
  IMAGEN4_PREVIEW: "img-imagen4-preview" as ImageModelId,
  IMAGEN3: "img-imagen3" as ImageModelId,
  NANO_BANANA: "img-nano-banana" as ImageModelId,
  NANO_BANANA_EDIT: "img-nano-banana-edit" as ImageModelId,
  NANO_BANANA_PRO: "img-nano-banana-pro" as ImageModelId,
  NANO_BANANA_PRO_EDIT: "img-nano-banana-pro-edit" as ImageModelId,
  SEEDREAM_V4: "img-seedream-v4" as ImageModelId,
  SEEDREAM_V4_EDIT: "img-seedream-v4-edit" as ImageModelId,
  SEEDREAM_V45: "img-seedream-v45" as ImageModelId,
  SEEDREAM_V45_EDIT: "img-seedream-v45-edit" as ImageModelId,
  GPT_IMAGE_1_5: "img-gpt-image-1-5" as ImageModelId,
  GPT_IMAGE_1_5_EDIT: "img-gpt-image-1-5-edit" as ImageModelId,
  HUNYUAN_V21: "img-hunyuan-v21" as ImageModelId,
  WAN_V22_A14B: "img-wan-v22-a14b" as ImageModelId,
  REVE: "img-reve" as ImageModelId,
  REVE_EDIT: "img-reve-edit" as ImageModelId,
  KLING_O1_IMAGE: "img-kling-o1" as ImageModelId,
  FLUX_2_MAX: "img-flux-2-max" as ImageModelId,
  FLUX_2_MAX_EDIT: "img-flux-2-max-edit" as ImageModelId,
} as const;

// Models that support multiple reference images (up to 10)
// Includes both unified models and their edit variants
export const MULTI_IMAGE_MODELS: ImageModelId[] = [
  // Unified models (base models that switch to edit when attachments present)
  IMAGE_MODEL_IDS.NANO_BANANA,
  IMAGE_MODEL_IDS.NANO_BANANA_PRO,
  IMAGE_MODEL_IDS.SEEDREAM_V4,
  IMAGE_MODEL_IDS.SEEDREAM_V45,
  IMAGE_MODEL_IDS.GPT_IMAGE_1_5,
  IMAGE_MODEL_IDS.FLUX_2_MAX,
  // Edit variants
  IMAGE_MODEL_IDS.NANO_BANANA_EDIT,
  IMAGE_MODEL_IDS.NANO_BANANA_PRO_EDIT,
  IMAGE_MODEL_IDS.SEEDREAM_V4_EDIT,
  IMAGE_MODEL_IDS.SEEDREAM_V45_EDIT,
  IMAGE_MODEL_IDS.KLING_O1_IMAGE,
  IMAGE_MODEL_IDS.FLUX_2_MAX_EDIT,
  IMAGE_MODEL_IDS.GPT_IMAGE_1_5_EDIT,
];

// Models that only support single reference image (replace existing)
export const SINGLE_IMAGE_MODELS: ImageModelId[] = [
  IMAGE_MODEL_IDS.REVE,
  IMAGE_MODEL_IDS.REVE_EDIT,
];

// Check if model supports multiple reference images
export function modelSupportsMultipleImages(id: ImageModelId): boolean {
  return MULTI_IMAGE_MODELS.includes(id);
}

// Check if model is Kling O1 (needs @Image mentions)
export function isKlingO1Model(id: ImageModelId): boolean {
  return id === IMAGE_MODEL_IDS.KLING_O1_IMAGE;
}

// Validate Kling O1 @Image mentions against available images
export function validateKlingO1Prompt(
  prompt: string,
  imageCount: number
): { valid: boolean; message?: string } {
  // Find all @ImageN mentions in prompt
  const mentionRegex = /@Image(\d+)/g;
  const mentions = [...prompt.matchAll(mentionRegex)];
  
  for (const match of mentions) {
    const imageIndex = parseInt(match[1], 10);
    if (imageIndex < 1 || imageIndex > imageCount) {
      return {
        valid: false,
        message: `@Image${imageIndex} referenced but only ${imageCount} image(s) attached`,
      };
    }
  }
  
  return { valid: true };
}
