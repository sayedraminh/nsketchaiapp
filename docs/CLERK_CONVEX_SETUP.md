# Clerk + Convex Integration Setup Guide

This document explains how to set up the Clerk authentication and Convex backend integration for the NSketch mobile app.

## Prerequisites

Before starting, you need the following values from your backend/web developer:

| Environment Variable | Description | Example |
|---------------------|-------------|---------|
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key | `pk_test_...` or `pk_live_...` |
| `EXPO_PUBLIC_CLERK_REDIRECT_URL` | OAuth redirect deep link | `nsketchapp://oauth-native-callback` |
| `EXPO_PUBLIC_CONVEX_URL` | Convex deployment URL | `https://your-deployment.convex.cloud` |
| `EXPO_PUBLIC_CLERK_PROXY_URL` (optional) | Custom Clerk proxy URL | `https://auth.yourdomain.com` |
| `EXPO_PUBLIC_API_BASE_URL` (optional) | Next.js API base URL | `https://yourdomain.com` |

## Setup Steps

### 1. Install Dependencies

```bash
npm install
# or
pnpm install
```

### 2. Create Environment File

Copy the example environment file and fill in the values:

```bash
cp .env.example .env
```

Edit `.env` with the values provided by your backend developer.

### 3. Get Convex Generated Files

**Option A: From backend developer**
- Request the `convex/_generated` folder from your backend/web developer
- Copy it to the `convex/` folder in this project

**Option B: Generate yourself**
```bash
npx convex dev
```
This requires `EXPO_PUBLIC_CONVEX_URL` to be set in your `.env` file.

### 4. Configure Clerk Dashboard (Backend Developer Task)

The backend developer needs to configure the following in the Clerk Dashboard:

1. **OAuth Redirect URLs**
   - Add `nsketchapp://oauth-native-callback` to the allowed redirect URLs for Google OAuth

2. **JWT Templates**
   - Ensure a `convex` JWT template exists for Convex authentication

### 5. Build the App

For development:
```bash
npx expo run:ios
# or
npx expo run:android
```

## Architecture Overview

### Authentication Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Welcome   │────▶│ Google/Email│────▶│   Main App  │
│   Screen    │     │   Sign In   │     │   (Tabs)    │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │    Clerk    │
                    │   Session   │
                    └─────────────┘
```

### Data Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Mobile App │────▶│    Clerk    │────▶│   Convex    │
│             │◀────│   (Auth)    │◀────│  (Backend)  │
└─────────────┘     └─────────────┘     └─────────────┘
       │                                       │
       │                                       │
       ▼                                       ▼
┌─────────────┐                        ┌─────────────┐
│ Local Cache │                        │  Same data  │
│ (Offline)   │                        │  as Web App │
└─────────────┘                        └─────────────┘
```

## File Structure

```
src/
├── lib/
│   ├── clerk.tsx          # Clerk provider wrapper
│   ├── convex.tsx         # Convex provider with Clerk auth
│   ├── network.ts         # Network status utilities
│   ├── api.ts             # Optional: Next.js API client
│   └── offlineSync.ts     # Offline sync worker
├── hooks/
│   └── useConvexAuth.ts   # Combined auth hook
├── state/
│   ├── offlineQueueStore.ts  # Pending generations queue
│   └── generationsCache.ts   # Local cache for offline
├── screens/
│   └── auth/
│       ├── WelcomeScreen.tsx
│       ├── EmailSignInScreen.tsx
│       ├── EmailSignUpScreen.tsx
│       └── ForgotPasswordScreen.tsx
├── navigation/
│   ├── RootNavigator.tsx  # Auth state router
│   ├── AuthNavigator.tsx  # Auth stack
│   └── AppNavigator.tsx   # Main app stack
└── components/
    └── NetworkBanner.tsx  # Offline indicator

convex/
├── _generated/            # Generated Convex API (from backend)
│   └── api.d.ts
└── README.md
```

## Usage Examples

### Check Auth Status

```typescript
import { useConvexAuth } from "../hooks/useConvexAuth";

function MyComponent() {
  const { isSignedIn, user, signOut } = useConvexAuth();
  
  if (!isSignedIn) {
    return <Text>Not signed in</Text>;
  }
  
  return (
    <View>
      <Text>Welcome, {user?.fullName}</Text>
      <Button onPress={signOut} title="Sign Out" />
    </View>
  );
}
```

### Use Convex Queries

```typescript
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

function GenerationsScreen() {
  // Query - auto-updates in real-time
  const generations = useQuery(api.generations.listForUser);
  
  // Mutation
  const createGeneration = useMutation(api.generations.create);
  
  const handleCreate = async () => {
    await createGeneration({
      prompt: "A beautiful sunset",
      style: "realistic",
    });
  };
  
  return (/* ... */);
}
```

### Offline-First Pattern

```typescript
import { useNetworkStatus } from "../lib/network";
import useOfflineQueueStore from "../state/offlineQueueStore";

function CreateScreen() {
  const { isConnected } = useNetworkStatus();
  const { addPendingGeneration } = useOfflineQueueStore();
  const createGeneration = useMutation(api.generations.create);
  
  const handleCreate = async (data) => {
    if (isConnected) {
      await createGeneration(data);
    } else {
      // Queue for later sync
      addPendingGeneration(data);
    }
  };
}
```

## Troubleshooting

### "Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY"
- Ensure you have created a `.env` file with the correct values
- Restart the Metro bundler after changing environment variables

### OAuth Redirect Not Working
- Verify the scheme `nsketchapp` is configured in `app.config.ts`
- Check that the redirect URL is added in Clerk Dashboard
- For iOS, rebuild the app after changing the scheme

### Convex Connection Issues
- Verify `EXPO_PUBLIC_CONVEX_URL` is correct
- Check that the Convex backend is deployed and accessible
- Ensure you have the latest `convex/_generated` files

### "Cannot find module 'convex/react'"
- Run `npm install` to install dependencies
- Check that `convex` is in your `package.json`

## Backend Developer Handoff Checklist

The backend/web developer should provide:

- [ ] `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`
- [ ] `EXPO_PUBLIC_CONVEX_URL`
- [ ] `EXPO_PUBLIC_CLERK_REDIRECT_URL` (confirm the scheme)
- [ ] `convex/_generated/` folder contents
- [ ] List of available Convex functions and their arguments
- [ ] (Optional) `EXPO_PUBLIC_API_BASE_URL` if using Next.js API routes
- [ ] (Optional) `EXPO_PUBLIC_CLERK_PROXY_URL` if using custom domain
