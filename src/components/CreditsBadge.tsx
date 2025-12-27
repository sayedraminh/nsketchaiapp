import React from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useCredits } from "../hooks/useCredits";

interface CreditsBadgeProps {
  showIcon?: boolean;
  size?: "small" | "medium" | "large";
  className?: string;
}

/**
 * CreditsBadge - Read-only display of user's available credits
 * 
 * This component safely displays credits from Convex without any local math.
 * Credits are fetched via api.users.getUserCredits and displayed as-is.
 * 
 * DO NOT add credit deduction logic here - let backend handle all credit operations.
 */
export default function CreditsBadge({ 
  showIcon = true, 
  size = "medium",
  className = "" 
}: CreditsBadgeProps) {
  const { credits, isLoading } = useCredits();

  const sizeStyles = {
    small: { text: "text-sm", icon: 14 },
    medium: { text: "text-base", icon: 18 },
    large: { text: "text-lg", icon: 22 },
  };

  const { text, icon } = sizeStyles[size];

  if (isLoading) {
    return (
      <View className={`flex-row items-center ${className}`}>
        <ActivityIndicator size="small" color="#facc15" />
      </View>
    );
  }

  return (
    <View className={`flex-row items-center ${className}`}>
      <Text className={`text-white ${text} font-semibold`}>
        {credits.toLocaleString()}
      </Text>
      {showIcon && (
        <Ionicons 
          name="flash" 
          size={icon} 
          color="#facc15" 
          style={{ marginLeft: 2 }} 
        />
      )}
    </View>
  );
}
