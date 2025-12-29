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
  | "img-flux-kontext-pro"
  | "img-gpt-image-1"
  | "img-gpt-image-1-edit"
  | "img-gpt-image-1-5"
  | "img-gpt-image-1-5-edit"
  | "img-hunyuan-v21"
  | "img-hunyuan-v3"
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

// Standard aspect ratios (subset used by most models)
export const STANDARD_ASPECT_RATIOS: AspectRatio[] = [
  "1:1",
  "4:3",
  "3:4",
  "16:9",
  "9:16",
];

// GPT-only aspect ratios
export const GPT_ASPECT_RATIOS: AspectRatio[] = ["1:1", "4:3", "3:4"];

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
  supportsResolution?: boolean;
  supportsQuality?: boolean;
  maxImages: number;
  creditCost: number;
  isQueued: boolean; // Whether this model uses queued polling
}

// Complete model registry
export const IMAGE_MODELS: ImageModelMeta[] = [
  // New models (isNew: true)
  {
    id: "img-gpt-image-1-5",
    label: "GPT-Image 1.5",
    company: "OpenAI",
    description: "OpenAI's latest image generation with quality tiers",
    logo: "openai",
    isNew: true,
    requiresAttachment: false,
    allowedAspectRatios: GPT_ASPECT_RATIOS,
    supportsQuality: true,
    maxImages: 4,
    creditCost: 5,
    isQueued: true,
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
    allowedAspectRatios: GPT_ASPECT_RATIOS,
    supportsQuality: true,
    maxImages: 4,
    creditCost: 5,
    isQueued: true,
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
    allowedAspectRatios: STANDARD_ASPECT_RATIOS,
    maxImages: 4,
    creditCost: 4,
    isQueued: true,
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
    allowedAspectRatios: STANDARD_ASPECT_RATIOS,
    maxImages: 4,
    creditCost: 4,
    isQueued: true,
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
    allowedAspectRatios: [
      "16:9",
      "9:16",
      "1:1",
      "4:3",
      "3:4",
      "3:2",
      "2:3",
      "21:9",
    ],
    supportsResolution: true,
    maxImages: 4,
    creditCost: 4,
    isQueued: true,
  },
  {
    id: "img-nano-banana-pro",
    label: "Nano Banana Pro",
    company: "Google",
    description: "Google's new state-of-the-art image generation model (1K/2K/4K)",
    logo: "googleg",
    isNew: true,
    requiresAttachment: false,
    allowedAspectRatios: VALID_ASPECT_RATIOS,
    supportsResolution: true,
    maxImages: 4,
    creditCost: 4,
    isQueued: true,
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
    allowedAspectRatios: VALID_ASPECT_RATIOS,
    supportsResolution: true,
    maxImages: 4,
    creditCost: 4,
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
    allowedAspectRatios: STANDARD_ASPECT_RATIOS,
    maxImages: 4,
    creditCost: 3,
    isQueued: true,
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
    allowedAspectRatios: STANDARD_ASPECT_RATIOS,
    maxImages: 4,
    creditCost: 3,
    isQueued: true,
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
    allowedAspectRatios: VALID_ASPECT_RATIOS,
    maxImages: 4,
    creditCost: 3,
    isQueued: true,
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
    allowedAspectRatios: VALID_ASPECT_RATIOS,
    maxImages: 4,
    creditCost: 3,
    isQueued: true,
  },
  {
    id: "img-imagen4-preview",
    label: "Imagen 4",
    company: "Google",
    description: "Standard quality, faster generation",
    logo: "googleg",
    isNew: false,
    requiresAttachment: false,
    allowedAspectRatios: STANDARD_ASPECT_RATIOS,
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
    allowedAspectRatios: VALID_ASPECT_RATIOS,
    maxImages: 4,
    creditCost: 4,
    isQueued: true, // Wavespeed queued
  },
  {
    id: "img-hunyuan-v3",
    label: "Hunyuan Image 3.0",
    company: "Tencent",
    description: "Tencent's latest text-to-image model with fast sync generation",
    logo: "hunyuan",
    isNew: false,
    requiresAttachment: false,
    allowedAspectRatios: STANDARD_ASPECT_RATIOS,
    maxImages: 4,
    creditCost: 3,
    isQueued: false, // sync model
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
    allowedAspectRatios: STANDARD_ASPECT_RATIOS,
    maxImages: 4,
    creditCost: 3,
    isQueued: false, // sync model
  },
  {
    id: "img-reve-edit",
    label: "Reve Edit",
    company: "Reve",
    description: "Edit and transform images with text prompts (1-10 reference images)",
    logo: "donereve",
    isNew: false,
    requiresAttachment: true,
    minAttachments: 1,
    maxAttachments: 10,
    allowedAspectRatios: STANDARD_ASPECT_RATIOS,
    maxImages: 4,
    creditCost: 3,
    isQueued: false, // sync model
  },
  {
    id: "img-seedream-v4",
    label: "Seedream v4",
    company: "ByteDance",
    description: "High-res 2K+ with strong text layout",
    logo: "bytedance-color",
    isNew: false,
    requiresAttachment: false,
    allowedAspectRatios: STANDARD_ASPECT_RATIOS,
    maxImages: 4,
    creditCost: 3,
    isQueued: true,
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
    allowedAspectRatios: STANDARD_ASPECT_RATIOS,
    maxImages: 4,
    creditCost: 3,
    isQueued: true,
  },
  {
    id: "img-flux-kontext-pro",
    label: "FLUX Kontext Pro",
    company: "FLUX",
    description: "Advanced image-to-image editing model",
    logo: "flux",
    isNew: false,
    requiresAttachment: true,
    minAttachments: 1,
    maxAttachments: 1, // Only 1 image supported
    allowedAspectRatios: STANDARD_ASPECT_RATIOS,
    maxImages: 4,
    creditCost: 4,
    isQueued: false, // sync model
  },
  {
    id: "img-gpt-image-1",
    label: "GPT-Image 1",
    company: "OpenAI",
    description: "OpenAI text-to-image generation",
    logo: "openai",
    isNew: false,
    requiresAttachment: false,
    allowedAspectRatios: GPT_ASPECT_RATIOS,
    maxImages: 4,
    creditCost: 4,
    isQueued: false, // sync (Azure)
  },
  {
    id: "img-gpt-image-1-edit",
    label: "GPT-Image 1 Edit",
    company: "OpenAI",
    description: "OpenAI image editing",
    logo: "openai",
    isNew: false,
    requiresAttachment: true,
    minAttachments: 1,
    maxAttachments: 1,
    allowedAspectRatios: GPT_ASPECT_RATIOS,
    maxImages: 4,
    creditCost: 4,
    isQueued: false, // sync (Azure)
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

// Helper to calculate credit cost
export function calculateImageCost(
  modelId: ImageModelId,
  numImages: number
): number {
  const model = getModelById(modelId);
  const baseCost = model?.creditCost ?? 3;
  return baseCost * numImages;
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

// Get display-friendly models (sorted: new first, then alphabetical)
export function getSortedModels(): ImageModelMeta[] {
  return [...IMAGE_MODELS].sort((a, b) => {
    // New models first
    if (a.isNew !== b.isNew) return a.isNew ? -1 : 1;
    // Then alphabetical by label
    return a.label.localeCompare(b.label);
  });
}

// Get only text-to-image models (no attachment required)
export function getTextToImageModels(): ImageModelMeta[] {
  return IMAGE_MODELS.filter((m) => !m.requiresAttachment);
}

// Get only edit models (attachment required)
export function getEditModels(): ImageModelMeta[] {
  return IMAGE_MODELS.filter((m) => m.requiresAttachment);
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
