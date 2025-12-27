import { useCallback } from "react";
import { useAuth as useClerkAuth, useUser } from "@clerk/clerk-expo";
import useGenerationsCacheStore from "../state/generationsCache";
import useOfflineQueueStore from "../state/offlineQueueStore";

export function useConvexAuth() {
  const { isSignedIn, signOut: clerkSignOut, getToken } = useClerkAuth();
  const { user } = useUser();
  const { clearCache } = useGenerationsCacheStore();
  const { clearAllForUser } = useOfflineQueueStore();

  const signOut = useCallback(async () => {
    try {
      clearCache();
      clearAllForUser();
      await clerkSignOut();
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  }, [clerkSignOut, clearCache, clearAllForUser]);

  const getConvexToken = useCallback(async () => {
    if (!isSignedIn) return null;
    try {
      return await getToken({ template: "convex" });
    } catch (error) {
      console.error("Error getting Convex token:", error);
      return null;
    }
  }, [isSignedIn, getToken]);

  return {
    isSignedIn,
    user,
    userId: user?.id,
    userEmail: user?.primaryEmailAddress?.emailAddress,
    userFullName: user?.fullName,
    userImageUrl: user?.imageUrl,
    signOut,
    getConvexToken,
    getToken,
  };
}

export default useConvexAuth;
