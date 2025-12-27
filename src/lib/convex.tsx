import React, { useCallback } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { useAuth } from "@clerk/clerk-expo";
import Constants from "expo-constants";

const convexUrl =
  Constants.expoConfig?.extra?.convexUrl ||
  process.env.EXPO_PUBLIC_CONVEX_URL;

if (!convexUrl) {
  throw new Error(
    "Missing EXPO_PUBLIC_CONVEX_URL. Please set it in your .env file."
  );
}

const convex = new ConvexReactClient(convexUrl, {
  unsavedChangesWarning: false,
});

interface ConvexProviderWithClerkProps {
  children: React.ReactNode;
}

export function ConvexProviderWithClerk({
  children,
}: ConvexProviderWithClerkProps) {
  const { getToken, isSignedIn } = useAuth();

  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
      if (!isSignedIn) {
        return null;
      }
      try {
        const token = await getToken({
          template: "convex",
          skipCache: forceRefreshToken,
        });
        return token;
      } catch (error) {
        console.error("Error fetching Convex token:", error);
        return null;
      }
    },
    [getToken, isSignedIn]
  );

  React.useEffect(() => {
    if (isSignedIn) {
      convex.setAuth(fetchAccessToken);
    } else {
      convex.clearAuth();
    }
  }, [isSignedIn, fetchAccessToken]);

  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}

export { convex, convexUrl };
