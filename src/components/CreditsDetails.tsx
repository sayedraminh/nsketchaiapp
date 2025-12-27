import React from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useCredits, useCreditsBreakdown } from "../hooks/useCredits";

interface CreditsDetailsProps {
  showBreakdown?: boolean;
  showReserved?: boolean;
  className?: string;
}

/**
 * CreditsDetails - Read-only detailed view of user's credit breakdown
 * 
 * This component safely displays credits from Convex without any local math.
 * Credits are fetched via api.users.getUserCredits and displayed as-is.
 * 
 * DO NOT add credit deduction logic here - let backend handle all credit operations.
 */
export default function CreditsDetails({ 
  showBreakdown = true,
  showReserved = false,
  className = "" 
}: CreditsDetailsProps) {
  const { credits, baseCredits, additionalCredits, isLoading } = useCredits();
  const breakdown = useCreditsBreakdown();

  if (isLoading) {
    return (
      <View className={`items-center justify-center py-4 ${className}`}>
        <ActivityIndicator size="large" color="#facc15" />
        <Text className="text-gray-500 text-sm mt-2">Loading credits...</Text>
      </View>
    );
  }

  return (
    <View className={`${className}`}>
      {/* Total Credits - Main Display */}
      <View className="flex-row items-center justify-center mb-4">
        <Text className="text-white text-3xl font-bold">
          {(showReserved ? breakdown.available : credits).toLocaleString()}
        </Text>
        <Ionicons 
          name="flash" 
          size={28} 
          color="#facc15" 
          style={{ marginLeft: 4 }} 
        />
      </View>
      <Text className="text-gray-400 text-center text-sm mb-4">
        Available Credits
      </Text>

      {/* Breakdown */}
      {showBreakdown && (
        <View className="bg-neutral-900 rounded-2xl p-4">
          <View className="flex-row justify-between items-center py-2 border-b border-neutral-800">
            <View className="flex-row items-center">
              <Ionicons name="sparkles-outline" size={18} color="#a78bfa" />
              <Text className="text-gray-300 ml-2">Plan Credits</Text>
            </View>
            <Text className="text-white font-semibold">
              {baseCredits.toLocaleString()}
            </Text>
          </View>

          <View className="flex-row justify-between items-center py-2 border-b border-neutral-800">
            <View className="flex-row items-center">
              <Ionicons name="add-circle-outline" size={18} color="#34d399" />
              <Text className="text-gray-300 ml-2">Additional Credits</Text>
            </View>
            <Text className="text-white font-semibold">
              {additionalCredits.toLocaleString()}
            </Text>
          </View>

          {showReserved && breakdown.reserved > 0 && (
            <View className="flex-row justify-between items-center py-2">
              <View className="flex-row items-center">
                <Ionicons name="time-outline" size={18} color="#fbbf24" />
                <Text className="text-gray-300 ml-2">In Progress</Text>
              </View>
              <Text className="text-yellow-400 font-semibold">
                -{breakdown.reserved.toLocaleString()}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
