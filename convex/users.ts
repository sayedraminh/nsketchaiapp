import { query } from "./_generated/server";
import { v } from "convex/values";

export const getCurrentUser = query({
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

    return user;
  },
});

export const getUserCredits = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { credits: 0, additionalCredits: 0, totalCredits: 0 };
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) {
      return { credits: 0, additionalCredits: 0, totalCredits: 0 };
    }

    const credits = user.credits ?? 0;
    const additionalCredits = user.additionalCredits ?? 0;

    return {
      credits,
      additionalCredits,
      totalCredits: credits + additionalCredits,
    };
  },
});

export const getUserCreditsBreakdown = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { total: 0, reserved: 0, available: 0 };
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();

    if (!user) {
      return { total: 0, reserved: 0, available: 0 };
    }

    const credits = user.credits ?? 0;
    const additionalCredits = user.additionalCredits ?? 0;
    const reservedCredits = (user as any).reservedCredits ?? 0;
    const total = credits + additionalCredits;

    return {
      total,
      reserved: reservedCredits,
      available: total - reservedCredits,
    };
  },
});
