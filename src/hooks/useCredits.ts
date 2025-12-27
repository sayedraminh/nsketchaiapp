import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

/**
 * useCredits - Read-only hook for displaying user credits
 * 
 * SAFE USAGE: This hook only reads credits from Convex.
 * DO NOT add credit deduction logic - let backend mutations handle all credit operations.
 * 
 * For generations, call the same "generate image/video/enhance" mutation as web does
 * and let that backend code handle credit deductions/reservations.
 */
export function useCredits() {
  const creditsData = useQuery(api.users.getUserCredits);
  const breakdown = useQuery(api.users.getUserCreditsBreakdown);

  return {
    credits: breakdown?.available ?? creditsData?.totalCredits ?? 0,
    baseCredits: creditsData?.credits ?? 0,
    additionalCredits: creditsData?.additionalCredits ?? 0,
    isLoading: creditsData === undefined || breakdown === undefined,
  };
}

/**
 * useCreditsBreakdown - Read-only hook for detailed credit breakdown
 * 
 * Returns { total, reserved, available } for detailed display.
 * - total: Plan credits + additional credits
 * - reserved: Credits currently held for in-progress generations
 * - available: Credits actually usable (total - reserved)
 * 
 * SAFE USAGE: This hook only reads credits from Convex.
 * DO NOT add credit deduction logic - let backend mutations handle all credit operations.
 */
export function useCreditsBreakdown() {
  const breakdown = useQuery(api.users.getUserCreditsBreakdown);

  return {
    total: breakdown?.total ?? 0,
    reserved: breakdown?.reserved ?? 0,
    available: breakdown?.available ?? 0,
    isLoading: breakdown === undefined,
  };
}
