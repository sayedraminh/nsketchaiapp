import React, { useRef } from "react";
import { View, Text, Pressable, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import Animated, { useSharedValue, useAnimatedScrollHandler, useAnimatedStyle, interpolate } from "react-native-reanimated";
import SessionsDrawer, { SessionsDrawerRef } from "../components/SessionsDrawer";
import { useCredits } from "../hooks/useCredits";
import { useUser } from "@clerk/clerk-expo";

export default function VideosScreen() {
  const { user } = useUser();
  const { credits, isLoading: creditsLoading } = useCredits();
  const drawerRef = useRef<SessionsDrawerRef>(null);
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, 50],
      [0, 1],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );
    return { opacity };
  });

  return (
    <SessionsDrawer ref={drawerRef} currentScreen="video">
      <View className="flex-1 bg-black">
        <SafeAreaView className="flex-1" edges={["top"]}>
          {/* Blurred Header with Animated Opacity */}
          <Animated.View style={[{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 10 }, headerAnimatedStyle]}>
            <BlurView intensity={80} tint="dark" style={{ width: "100%", height: "100%" }}>
              <LinearGradient
                colors={["rgba(0,0,0,0.8)", "rgba(0,0,0,0.4)", "transparent"]}
                style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
              />
              <SafeAreaView edges={["top"]}>
                <View className="px-5 py-2 flex-row items-center justify-between">
                  <Pressable className="active:opacity-70" onPress={() => drawerRef.current?.openDrawer()}>
                    <Ionicons name="menu" size={28} color="#fff" />
                  </Pressable>
                  <View className="flex-row items-center">
                    <View className="flex-row items-center mr-3">
                      <Text className="text-white text-base font-semibold">
                        {creditsLoading ? "..." : credits.toLocaleString()}
                      </Text>
                      <Ionicons name="flash" size={18} color="#facc15" style={{ marginLeft: 2 }} />
                    </View>
                    <Pressable className="active:opacity-70">
                      {user?.imageUrl ? (
                        <Image
                          source={{ uri: user.imageUrl }}
                          style={{ width: 36, height: 36, borderRadius: 18 }}
                        />
                      ) : (
                        <LinearGradient
                          colors={["#60a5fa", "#c4b5fd", "#fcd34d"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={{ width: 36, height: 36, borderRadius: 18 }}
                        />
                      )}
                    </Pressable>
                  </View>
                </View>
              </SafeAreaView>
            </BlurView>
          </Animated.View>

          {/* Static Header (always visible underneath) */}
          <View style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 9 }}>
            <SafeAreaView edges={["top"]}>
              <View className="px-5 py-2 flex-row items-center justify-between">
                <Pressable className="active:opacity-70" onPress={() => drawerRef.current?.openDrawer()}>
                  <Ionicons name="menu" size={28} color="#fff" />
                </Pressable>
                <View className="flex-row items-center">
                  <View className="flex-row items-center mr-3">
                    <Text className="text-white text-base font-semibold">
                      {creditsLoading ? "..." : credits.toLocaleString()}
                    </Text>
                    <Ionicons name="flash" size={18} color="#facc15" style={{ marginLeft: 2 }} />
                  </View>
                  <Pressable className="active:opacity-70">
                    {user?.imageUrl ? (
                      <Image
                        source={{ uri: user.imageUrl }}
                        style={{ width: 36, height: 36, borderRadius: 18 }}
                      />
                    ) : (
                      <LinearGradient
                        colors={["#60a5fa", "#c4b5fd", "#fcd34d"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{ width: 36, height: 36, borderRadius: 18 }}
                      />
                    )}
                  </Pressable>
                </View>
              </View>
            </SafeAreaView>
          </View>

          <Animated.ScrollView
            className="flex-1"
            contentContainerStyle={{ flexGrow: 1, alignItems: "center", justifyContent: "center" }}
            onScroll={scrollHandler}
            scrollEventThrottle={16}
          >
            <Image 
              source={require("../../assets/vidnewgrad.png")} 
              style={{ width: 52, height: 52, borderRadius: 12, marginBottom: 8 }}
              resizeMode="cover"
            />
            <Text className="text-white text-sm font-medium">Video</Text>
          </Animated.ScrollView>
        </SafeAreaView>
      </View>
    </SessionsDrawer>
  );
}

