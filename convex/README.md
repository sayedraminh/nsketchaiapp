# Convex Integration

This folder contains only the **generated files** from the shared Convex deployment.

> ⚠️ **Important**: The Convex backend functions (mutations, queries) are managed in the **web repository**. The mobile app only consumes the API - it does NOT define backend logic.

## Setup Instructions

1. Get the `convex/_generated/` folder from the web/backend team
2. Copy those files into this `convex/_generated/` directory
3. Set `EXPO_PUBLIC_CONVEX_URL` in your `.env` to the same deployment URL used by web

The web team generates these files when they run `npx convex dev` or `npx convex deploy`.

## What to expect

After setup, the `_generated` folder should contain:
- `api.d.ts` - TypeScript types for all Convex functions
- `api.js` - JavaScript exports for all Convex functions
- Other generated files

## Using Convex in the app

```typescript
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

// Query example
const generations = useQuery(api.generations.listForUser, { userId: "..." });

// Mutation example
const createGeneration = useMutation(api.generations.create);
await createGeneration({ prompt: "...", style: "..." });
```

## Available Functions (to be documented by backend dev)

The backend developer should provide a list of available Convex functions:

### Queries
- `api.generations.list` - List all generations
- `api.generations.listForUser` - List generations for current user
- `api.generations.get` - Get a single generation by ID

### Mutations
- `api.generations.create` - Create a new generation job
- `api.generations.update` - Update a generation
- `api.generations.delete` - Delete a generation

### Expected Arguments (to be filled in by backend dev)

```typescript
// Example: create generation
{
  prompt: string;
  style?: string;
  aspectRatio?: string;
  model?: string;
}
```
