import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all sessions for the current user, ordered by updatedAt desc
export const getUserSessions = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    // Get user from users table
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) {
      return [];
    }

    // Get all sessions for this user, sorted by updatedAt desc
    const sessions = await ctx.db
      .query("sessions")
      .filter((q) => q.eq(q.field("userId"), user._id))
      .order("desc")
      .collect();

    return sessions;
  },
});

// Get all generations inside a specific session
export const getSessionGenerations = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    // Verify the session belongs to the current user
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      return [];
    }

    // Get user
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user || session.userId !== user._id) {
      return [];
    }

    // Get all generations for this session
    const generations = await ctx.db
      .query("sessionGenerations")
      .filter((q) => q.eq(q.field("sessionId"), args.sessionId))
      .order("asc")
      .collect();

    return generations;
  },
});

// Create a new session
export const createSession = mutation({
  args: {
    title: v.optional(v.string()),
    type: v.union(v.literal("image"), v.literal("video"), v.literal("edit"), v.literal("assets")),
    forceNew: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get user
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Default titles based on type
    const defaultTitles: Record<string, string> = {
      image: "New Image Session",
      video: "New Video Session",
      edit: "New Enhance Session",
      assets: "All Assets",
    };

    // If not forcing new, try to find an existing empty session of same type
    if (!args.forceNew) {
      const existingSession = await ctx.db
        .query("sessions")
        .filter((q) =>
          q.and(
            q.eq(q.field("userId"), user._id),
            q.eq(q.field("type"), args.type)
          )
        )
        .order("desc")
        .first();

      // Check if the existing session has any generations
      if (existingSession) {
        const generationCount = await ctx.db
          .query("sessionGenerations")
          .filter((q) => q.eq(q.field("sessionId"), existingSession._id))
          .collect();

        if (generationCount.length === 0) {
          // Reuse this empty session
          return existingSession._id;
        }
      }
    }

    // Create new session
    const now = Date.now();
    const sessionId = await ctx.db.insert("sessions", {
      userId: user._id,
      title: args.title || defaultTitles[args.type] || "New Session",
      type: args.type,
      preview: undefined,
      createdAt: now,
      updatedAt: now,
    });

    return sessionId;
  },
});

// Delete a session (moves media to Assets session)
export const deleteSession = mutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get user
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Get the session
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== user._id) {
      throw new Error("Session not found or unauthorized");
    }

    // Don't allow deleting the Assets session
    if (session.type === "assets") {
      throw new Error("Cannot delete the Assets session");
    }

    // Get or create the Assets session
    let assetsSession = await ctx.db
      .query("sessions")
      .filter((q) =>
        q.and(
          q.eq(q.field("userId"), user._id),
          q.eq(q.field("type"), "assets")
        )
      )
      .first();

    if (!assetsSession) {
      const now = Date.now();
      const assetsSessionId = await ctx.db.insert("sessions", {
        userId: user._id,
        title: "All Assets",
        type: "assets",
        preview: undefined,
        createdAt: now,
        updatedAt: now,
      });
      assetsSession = await ctx.db.get(assetsSessionId);
    }

    // Move all generations to the Assets session
    const generations = await ctx.db
      .query("sessionGenerations")
      .filter((q) => q.eq(q.field("sessionId"), args.sessionId))
      .collect();

    for (const gen of generations) {
      await ctx.db.patch(gen._id, {
        sessionId: assetsSession!._id,
      });
    }

    // Update Assets session preview if needed
    if (generations.length > 0 && !assetsSession!.preview) {
      const firstGen = generations[0];
      const preview =
        firstGen.previewImage ||
        (firstGen.images && firstGen.images[0]?.url) ||
        (firstGen.videos && firstGen.videos[0]);

      if (preview) {
        await ctx.db.patch(assetsSession!._id, {
          preview,
          updatedAt: Date.now(),
        });
      }
    }

    // Delete the original session
    await ctx.db.delete(args.sessionId);

    return { success: true };
  },
});

// Get or create the Assets session for the current user
export const getOrCreateAssetsSession = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) {
      return null;
    }

    // Find existing assets session
    const assetsSession = await ctx.db
      .query("sessions")
      .filter((q) =>
        q.and(
          q.eq(q.field("userId"), user._id),
          q.eq(q.field("type"), "assets")
        )
      )
      .first();

    return assetsSession;
  },
});

// Create assets session if it doesn't exist (mutation)
export const ensureAssetsSession = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Find existing assets session
    let assetsSession = await ctx.db
      .query("sessions")
      .filter((q) =>
        q.and(
          q.eq(q.field("userId"), user._id),
          q.eq(q.field("type"), "assets")
        )
      )
      .first();

    if (!assetsSession) {
      const now = Date.now();
      const sessionId = await ctx.db.insert("sessions", {
        userId: user._id,
        title: "All Assets",
        type: "assets",
        preview: undefined,
        createdAt: now,
        updatedAt: now,
      });
      assetsSession = await ctx.db.get(sessionId);
    }

    return assetsSession;
  },
});

// Delete a specific media item (image or video) from an asset
export const deleteAssetMedia = mutation({
  args: {
    generationId: v.id("sessionGenerations"),
    mediaType: v.union(v.literal("image"), v.literal("video")),
    mediaIndex: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Get the generation
    const generation = await ctx.db.get(args.generationId);
    if (!generation) {
      throw new Error("Generation not found");
    }

    // Verify the generation belongs to user's assets session
    const session = await ctx.db.get(generation.sessionId);
    if (!session || session.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    // Remove the media item
    if (args.mediaType === "image") {
      const images = generation.images || [];
      if (args.mediaIndex < 0 || args.mediaIndex >= images.length) {
        throw new Error("Invalid media index");
      }
      const newImages = images.filter((_: any, i: number) => i !== args.mediaIndex);
      
      // If no more images and no videos, delete the whole generation
      const videos = generation.videos || [];
      if (newImages.length === 0 && videos.length === 0) {
        // Delete any favorites for this generation
        const favorites = await ctx.db
          .query("favorites")
          .filter((q) => q.eq(q.field("generationId"), args.generationId))
          .collect();
        for (const fav of favorites) {
          await ctx.db.delete(fav._id);
        }
        await ctx.db.delete(args.generationId);
      } else {
        // Update with removed image
        await ctx.db.patch(args.generationId, { images: newImages });
        // Delete favorite for this specific image if exists
        const favorite = await ctx.db
          .query("favorites")
          .filter((q) =>
            q.and(
              q.eq(q.field("generationId"), args.generationId),
              q.eq(q.field("mediaType"), "image"),
              q.eq(q.field("mediaIndex"), args.mediaIndex)
            )
          )
          .first();
        if (favorite) {
          await ctx.db.delete(favorite._id);
        }
      }
    } else {
      const videos = generation.videos || [];
      if (args.mediaIndex < 0 || args.mediaIndex >= videos.length) {
        throw new Error("Invalid media index");
      }
      const newVideos = videos.filter((_: any, i: number) => i !== args.mediaIndex);
      
      // If no more videos and no images, delete the whole generation
      const images = generation.images || [];
      if (newVideos.length === 0 && images.length === 0) {
        // Delete any favorites for this generation
        const favorites = await ctx.db
          .query("favorites")
          .filter((q) => q.eq(q.field("generationId"), args.generationId))
          .collect();
        for (const fav of favorites) {
          await ctx.db.delete(fav._id);
        }
        await ctx.db.delete(args.generationId);
      } else {
        // Update with removed video
        await ctx.db.patch(args.generationId, { videos: newVideos });
        // Delete favorite for this specific video if exists
        const favorite = await ctx.db
          .query("favorites")
          .filter((q) =>
            q.and(
              q.eq(q.field("generationId"), args.generationId),
              q.eq(q.field("mediaType"), "video"),
              q.eq(q.field("mediaIndex"), args.mediaIndex)
            )
          )
          .first();
        if (favorite) {
          await ctx.db.delete(favorite._id);
        }
      }
    }

    // Update the parent session's updatedAt
    await ctx.db.patch(session._id, { updatedAt: Date.now() });

    return { success: true };
  },
});

// Toggle favorite for a media item
export const toggleFavorite = mutation({
  args: {
    generationId: v.id("sessionGenerations"),
    mediaType: v.union(v.literal("image"), v.literal("video")),
    mediaIndex: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Verify the generation exists and belongs to user
    const generation = await ctx.db.get(args.generationId);
    if (!generation) {
      throw new Error("Generation not found");
    }

    const session = await ctx.db.get(generation.sessionId);
    if (!session || session.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    // Check if favorite already exists
    const existingFavorite = await ctx.db
      .query("favorites")
      .filter((q) =>
        q.and(
          q.eq(q.field("userId"), user._id),
          q.eq(q.field("generationId"), args.generationId),
          q.eq(q.field("mediaType"), args.mediaType),
          q.eq(q.field("mediaIndex"), args.mediaIndex)
        )
      )
      .first();

    if (existingFavorite) {
      // Remove favorite
      await ctx.db.delete(existingFavorite._id);
      return { isFavorite: false };
    } else {
      // Add favorite
      await ctx.db.insert("favorites", {
        userId: user._id,
        generationId: args.generationId,
        mediaType: args.mediaType,
        mediaIndex: args.mediaIndex,
        createdAt: Date.now(),
      });
      return { isFavorite: true };
    }
  },
});

// List all favorites for the current user
export const listFavorites = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) {
      return [];
    }

    const favorites = await ctx.db
      .query("favorites")
      .filter((q) => q.eq(q.field("userId"), user._id))
      .order("desc")
      .collect();

    return favorites;
  },
});
