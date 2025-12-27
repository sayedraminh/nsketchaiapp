import React from "react";
import { View, Text, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNetworkStatus } from "../lib/network";

export default function NetworkBanner() {
  const { isConnected } = useNetworkStatus();
  const insets = useSafeAreaInsets();
  const translateY = React.useRef(new Animated.Value(-100)).current;

  React.useEffect(() => {
    Animated.timing(translateY, {
      toValue: isConnected ? -100 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isConnected, translateY]);

  return (
    <Animated.View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        transform: [{ translateY }],
        paddingTop: insets.top,
      }}
    >
      <View className="bg-red-600 flex-row items-center justify-center py-2 px-4">
        <Ionicons name="cloud-offline-outline" size={18} color="#fff" />
        <Text className="text-white text-sm font-medium ml-2">
          No internet connection
        </Text>
      </View>
    </Animated.View>
  );
}
