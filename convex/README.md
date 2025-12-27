# Convex Integration

This folder is a placeholder for the Convex generated files.

## Setup Instructions

### Option 1: Get generated files from web/backend dev

The backend/web developer should provide you with the `convex/_generated` folder from the shared Convex project. Copy those files here.

### Option 2: Generate files yourself

1. Make sure you have the `EXPO_PUBLIC_CONVEX_URL` set in your `.env` file
2. Run:
   ```bash
   npx convex dev
   ```
3. This will generate the `_generated` folder with the actual API types

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
