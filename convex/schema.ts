import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    credits: v.optional(v.number()), // User's available credits
    additionalCredits: v.optional(v.number()), // Lifetime add-on credits
    reservedCredits: v.optional(v.number()), // Credits reserved for in-flight jobs (not yet deducted)
    stripeCustomerId: v.optional(v.string()), // Stripe customer ID
    subscriptionStatus: v.optional(v.string()), // active, canceled, etc.
    subscriptionPlan: v.optional(v.string()), // basic, pro, max
    subscriptionPeriodEnd: v.optional(v.number()), // Subscription end timestamp
    lastMonthlyCreditAt: v.optional(v.number()), // Timestamp (ms) of last monthly credit cycle
    lastCycleCreditsBaseline: v.optional(v.number()), // Credits granted at the start of the current cycle
    welcomeModalDismissCount: v.optional(v.number()), // How many times user dismissed welcome tutorial
    welcomeEmailSent: v.optional(v.boolean()), // Whether welcome email has been sent
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_clerk_id", ["clerkId"]).index("by_stripe_customer", ["stripeCustomerId"]),

  generations: defineTable({
    userId: v.id("users"),
    type: v.union(v.literal("image"), v.literal("video"), v.literal("edit"), v.literal("assets")),
    prompt: v.string(),
    imageUrl: v.optional(v.string()),
    videoUrl: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("generating"),
      v.literal("completed"),
      v.literal("failed")
    ),
    modelId: v.optional(v.string()),
    requestId: v.optional(v.string()),
    sessionId: v.optional(v.id("sessions")),
    generationMetadata: v.optional(v.string()),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
    error: v.optional(v.string()),
  }).index("by_user", ["userId"]).index("by_status", ["status"]),

  apiKeys: defineTable({
    userId: v.id("users"),
    service: v.string(), // e.g., "google", "openai", etc.
    keyHash: v.string(), // hashed version of the API key
    createdAt: v.number(),
    lastUsed: v.optional(v.number()),
  }).index("by_user", ["userId"]).index("by_service", ["service"]),

  sessions: defineTable({
    userId: v.id("users"),
    title: v.string(),
    type: v.union(v.literal("image"), v.literal("video"), v.literal("edit"), v.literal("assets")),
    preview: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  sessionGenerations: defineTable({
    sessionId: v.id("sessions"),
    userId: v.id("users"),
    prompt: v.string(),
    type: v.union(v.literal("image"), v.literal("video"), v.literal("edit"), v.literal("assets")),
    removeWatermark: v.optional(v.boolean()),
    model: v.optional(v.string()),
    modelLabel: v.optional(v.string()),
    generationStatus: v.optional(v.string()),
    externalRequestId: v.optional(v.string()),
    providerEndpoint: v.optional(v.string()),
    aspectRatio: v.optional(v.string()),
    numImages: v.optional(v.number()),
    images: v.optional(v.array(v.object({
      url: v.string(),
      imageBytes: v.optional(v.string())
    }))),
    videos: v.optional(v.array(v.string())),
    sourceImage: v.optional(v.string()),
    previewImage: v.optional(v.string()), // WebP version for enhanced images (display optimization)
    isLoading: v.boolean(),
    creditsUsed: v.optional(v.number()), // Credits consumed for this generation
    refunded: v.optional(v.boolean()), // Whether credits were refunded for this generation
    quality: v.optional(v.union(v.literal("medium"), v.literal("high"))), // GPT-Image 1.5 quality tier
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
    error: v.optional(v.string()),
    concurrencySlotId: v.optional(v.id("generations")),
  }).index("by_session", ["sessionId"]).index("by_user", ["userId"]).index("by_concurrency_slot", ["concurrencySlotId"]),

  // User favorites for specific media items within a generation
  favorites: defineTable({
    userId: v.id("users"),
    generationId: v.id("sessionGenerations"),
    mediaType: v.union(v.literal("image"), v.literal("video")),
    index: v.number(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_target", ["userId", "generationId", "mediaType", "index"])
    .index("by_generation", ["generationId"]),

  // User cloned voices with Cartesia Sonic 3 voice IDs
  clonedVoices: defineTable({
    userId: v.id("users"),
    name: v.string(), // User-given name for the voice
    audioUrl: v.string(), // Original R2 URL for VibeVoice fallback
    gender: v.union(v.literal("male"), v.literal("female")), // Required for Cartesia localization
    cartesiaVoiceId: v.string(), // Base cloned voice ID from Cartesia
    localizedVoices: v.object({ // Voice IDs per language from Cartesia localize API
      en: v.optional(v.string()),
      de: v.optional(v.string()),
      es: v.optional(v.string()),
      fr: v.optional(v.string()),
      ja: v.optional(v.string()),
      pt: v.optional(v.string()),
      zh: v.optional(v.string()),
      hi: v.optional(v.string()),
      it: v.optional(v.string()),
      ko: v.optional(v.string()),
      nl: v.optional(v.string()),
      pl: v.optional(v.string()),
      ru: v.optional(v.string()),
      sv: v.optional(v.string()),
      tr: v.optional(v.string()),
    }),
    // Languages still being localized in the background
    pendingLanguages: v.optional(v.array(v.string())),
    // Reference to the session generation (for deletion sync)
    sessionId: v.optional(v.id("sessions")),
    generationId: v.optional(v.id("sessionGenerations")),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_name", ["userId", "name"]),

  // Track processed Stripe invoices for idempotency (prevent double credit grants)
  processedStripeInvoices: defineTable({
    invoiceId: v.string(),
    customerId: v.string(),
    creditsGranted: v.number(),
    billingReason: v.string(),
    processedAt: v.number(),
  })
    .index("by_invoice_id", ["invoiceId"])
    .index("by_customer", ["customerId"]),

  // Talking photo generation tasks (persisted across page reloads)
  talkingPhotoTasks: defineTable({
    clerkId: v.string(), // User's Clerk ID
    kieTaskId: v.string(), // KIE API task ID
    status: v.union(
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    mode: v.string(), // "pro" or "standard"
    prompt: v.string(),
    imageUrl: v.string(),
    audioUrl: v.string(),
    videoUrl: v.optional(v.string()), // Result video URL when completed
    creditsCharged: v.number(),
    creditsRefunded: v.optional(v.boolean()),
    error: v.optional(v.string()),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_kie_task_id", ["kieTaskId"]),

  // ============================================
  // AUTOPILOT SERIES TABLES
  // ============================================

  // Connected YouTube/Instagram channels with OAuth tokens
  autopilotChannels: defineTable({
    userId: v.id("users"),
    platform: v.union(v.literal("youtube"), v.literal("instagram"), v.literal("tiktok")),
    channelId: v.string(), // YouTube channel ID or Instagram user ID
    channelName: v.string(), // YouTube channel name or Instagram username
    channelThumbnail: v.optional(v.string()),
    accessToken: v.string(), // encrypted
    refreshToken: v.string(), // encrypted
    tokenExpiry: v.number(),
    // Instagram-specific fields
    instagramAccountType: v.optional(v.string()), // "BUSINESS" or "CREATOR"
    instagramPageId: v.optional(v.string()), // Facebook Page ID linked to IG (for Business accounts)
    needsReconnect: v.optional(v.boolean()), // Set when auth fails (user revoked access, etc.)
    authError: v.optional(v.string()), // Error message for why reconnection is needed
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_channel_id", ["channelId"])
    .index("by_platform", ["platform"]),

  // Series configuration (niche, voice, style, schedule)
  autopilotSeries: defineTable({
    userId: v.id("users"),
    channelId: v.id("autopilotChannels"), // Primary channel (legacy, for backward compatibility)
    channelIds: v.optional(v.array(v.id("autopilotChannels"))), // Multiple channels for multi-platform publishing
    title: v.string(),
    description: v.optional(v.string()),
    niche: v.string(), // preset key or "custom"
    customNichePrompt: v.optional(v.string()), // user-defined prompt for custom niche
    voicePreset: v.string(), // voice identifier
    voicePresetUrl: v.optional(v.string()), // custom voice URL if applicable
    videoStyle: v.union(
      v.literal("faceless"),
      v.literal("talking_head"),
      v.literal("stock_broll")
    ),
    // Generation workflow configuration
    generationMode: v.optional(v.union(
      v.literal("image_to_video"), // Generate images first, then convert to video
      v.literal("text_to_video")   // Generate video directly from text
    )),
    imageModel: v.optional(v.string()), // Model for image generation (e.g., "kling-2.5", "sora-2")
    videoModel: v.optional(v.string()), // Model for video generation or image-to-video conversion
    videoDuration: v.optional(v.number()), // Duration in seconds for video generation
    aspectRatio: v.union(v.literal("9:16"), v.literal("16:9"), v.literal("1:1")),
    scheduleType: v.union(v.literal("one_time"), v.literal("recurring")),
    recurringDays: v.optional(v.array(v.number())), // 0-6 for Sunday-Saturday
    recurringTime: v.optional(v.string()), // HH:MM format (legacy, single time)
    recurringCount: v.optional(v.number()), // videos per week (legacy)
    // New scheduling fields
    postsPerDay: v.optional(v.number()), // 1-10 posts per day
    postingTimes: v.optional(v.array(v.string())), // Array of times ["09:00", "18:00"]
    timezone: v.string(),
    status: v.union(
      v.literal("active"),
      v.literal("paused"),
      v.literal("draft")
    ),
    pausedReason: v.optional(v.union(
      v.literal("manual"),           // User manually paused
      v.literal("insufficient_credits") // System paused due to low credits
    )),
    episodeCount: v.number(), // total episodes generated
    lastEpisodeAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_channel", ["channelId"])
    .index("by_status", ["status"]),

  // Individual episodes with scripts, media, and status
  autopilotEpisodes: defineTable({
    seriesId: v.id("autopilotSeries"),
    userId: v.id("users"),
    episodeNumber: v.number(),
    title: v.string(),
    description: v.optional(v.string()), // YouTube description
    script: v.string(),
    caption: v.optional(v.string()), // Social media caption with hashtags
    scenes: v.array(v.object({
      index: v.number(),
      text: v.string(), // narration text for this scene
      imagePrompt: v.string(), // prompt for image/video generation
      imageUrl: v.optional(v.string()), // generated scene image
      videoUrl: v.optional(v.string()), // generated scene video clip
      requestId: v.optional(v.string()), // async generation task ID (for polling status)
      provider: v.optional(v.string()), // video provider (fal-ai/veo3.1/fast, kie-sora, etc.) for status polling
      duration: v.optional(v.number()), // scene duration in seconds
      retryCount: v.optional(v.number()), // number of retry attempts for this scene
      status: v.optional(v.string()), // "pending", "generating", "completed", "failed"
      error: v.optional(v.string()), // error message if failed
    })),
    audioUrl: v.optional(v.string()), // full narration audio
    finalVideoUrl: v.optional(v.string()), // assembled final video
    thumbnailUrl: v.optional(v.string()), // YouTube thumbnail
    status: v.union(
      v.literal("draft"),
      v.literal("generating_script"),
      v.literal("generating_scenes"),
      v.literal("generating_audio"),
      v.literal("assembling"),
      v.literal("ready"),
      v.literal("scheduled"),
      v.literal("publishing"),
      v.literal("published"),
      v.literal("failed")
    ),
    error: v.optional(v.string()),
    scheduledFor: v.optional(v.number()), // timestamp for publishing
    publishedAt: v.optional(v.number()),
    // YouTube-specific publish data
    youtubeVideoId: v.optional(v.string()),
    youtubeUrl: v.optional(v.string()),
    // Instagram-specific publish data
    instagramMediaId: v.optional(v.string()),
    instagramUrl: v.optional(v.string()),
    // TikTok-specific publish data
    tiktokPublishId: v.optional(v.string()),
    tiktokUrl: v.optional(v.string()),
    creditsUsed: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_series", ["seriesId"])
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_scheduled", ["scheduledFor"]),

  // Track pending video generation tasks for webhook updates
  autopilotPendingTasks: defineTable({
    taskId: v.string(), // KIE/external API task ID
    episodeId: v.id("autopilotEpisodes"),
    sceneIndex: v.number(), // Which scene this task is for
    provider: v.string(), // "kie-sora", "fal", etc.
    status: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("failed")
    ),
    videoUrl: v.optional(v.string()),
    error: v.optional(v.string()),
    creditsToDeduct: v.optional(v.number()), // Credits to deduct when video completes
    seriesId: v.optional(v.id("autopilotSeries")), // For credit deduction
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_task_id", ["taskId"])
    .index("by_episode", ["episodeId"])
    .index("by_status", ["status"]),
});
