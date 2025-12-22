import React from "react";
import { View, Text, Pressable, ScrollView, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type VideoModelSelectorRouteProp = RouteProp<RootStackParamList, "VideoModelSelector">;

export default function VideoModelSelectorModal() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<VideoModelSelectorRouteProp>();
  const { onSelectModel, currentModel } = route.params;

  const handleSelectModel = (modelName: string) => {
    onSelectModel(modelName);
    navigation.goBack();
  };

  return (
    <View className="flex-1" style={{ backgroundColor: "#1a1a1a" }}>
      <SafeAreaView className="flex-1" edges={["top"]} style={{ backgroundColor: "#1a1a1a" }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
          bounces={true}
          scrollEventThrottle={16}
          nestedScrollEnabled={true}
        >
          <View className="px-5 py-6">
            {/* Sora 2 */}
            <Pressable
              onPress={() => handleSelectModel("Sora 2")}
              className="mb-6 active:opacity-70"
            >
              <View className="flex-row items-start mb-3">
                <View className="w-12 h-12 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: "#2a2a2a" }}>
                  <Image source={require("../../assets/sora.png")} style={{ width: 32, height: 32 }} resizeMode="contain" />
                </View>
                <View className="flex-1">
                  <Text className="text-white text-2xl font-bold">Sora 2</Text>
                  <Text className="text-base mt-1" style={{ color: "#888" }}>
                    {"OpenAI's state-of-the-art video generation"}
                  </Text>
                </View>
              </View>
              <View className="flex-row flex-wrap">
                <View className="rounded-full px-3 py-1 mr-2 mb-2" style={{ backgroundColor: "#0066FF" }}>
                  <Text className="text-white text-xs font-semibold">New</Text>
                </View>
                <View className="rounded-full px-3 py-1 mr-2 mb-2 flex-row items-center" style={{ backgroundColor: "#2a2a2a" }}>
                  <Ionicons name="tv-outline" size={12} color="#fff" />
                  <Text className="text-white text-xs ml-1">720p</Text>
                </View>
                <View className="rounded-full px-3 py-1 mr-2 mb-2 flex-row items-center" style={{ backgroundColor: "#2a2a2a" }}>
                  <Ionicons name="time-outline" size={12} color="#fff" />
                  <Text className="text-white text-xs ml-1">10s-15s</Text>
                </View>
                <View className="rounded-full px-3 py-1 mb-2 flex-row items-center" style={{ backgroundColor: "#2a2a2a" }}>
                  <Ionicons name="flash" size={12} color="#fff" />
                  <Text className="text-white text-xs ml-1">30 credits</Text>
                </View>
              </View>
            </Pressable>

            {/* Ovi */}
            <Pressable
              onPress={() => handleSelectModel("Ovi")}
              className="mb-6 active:opacity-70"
            >
              <View className="flex-row items-start mb-3">
                <View className="w-12 h-12 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: "#2a2a2a" }}>
                  <Image source={require("../../assets/ovi.png")} style={{ width: 32, height: 32 }} resizeMode="contain" />
                </View>
                <View className="flex-1">
                  <Text className="text-white text-2xl font-bold">Ovi</Text>
                  <Text className="text-base mt-1" style={{ color: "#888" }}>
                    Unified audio-video generation with sound
                  </Text>
                </View>
              </View>
              <View className="flex-row flex-wrap">
                <View className="rounded-full px-3 py-1 mr-2 mb-2" style={{ backgroundColor: "#0066FF" }}>
                  <Text className="text-white text-xs font-semibold">New</Text>
                </View>
                <View className="rounded-full px-3 py-1 mr-2 mb-2 flex-row items-center" style={{ backgroundColor: "#2a2a2a" }}>
                  <Ionicons name="tv-outline" size={12} color="#fff" />
                  <Text className="text-white text-xs ml-1">Various</Text>
                </View>
                <View className="rounded-full px-3 py-1 mr-2 mb-2 flex-row items-center" style={{ backgroundColor: "#2a2a2a" }}>
                  <Ionicons name="time-outline" size={12} color="#fff" />
                  <Text className="text-white text-xs ml-1">5s</Text>
                </View>
                <View className="rounded-full px-3 py-1 mr-2 mb-2 flex-row items-center" style={{ backgroundColor: "#2a2a2a" }}>
                  <Ionicons name="musical-notes-outline" size={12} color="#fff" />
                  <Text className="text-white text-xs ml-1">Audio</Text>
                </View>
                <View className="rounded-full px-3 py-1 mb-2 flex-row items-center" style={{ backgroundColor: "#2a2a2a" }}>
                  <Ionicons name="flash" size={12} color="#fff" />
                  <Text className="text-white text-xs ml-1">21 credits</Text>
                </View>
              </View>
            </Pressable>

            {/* Kandinsky 5 */}
            <Pressable
              onPress={() => handleSelectModel("Kandinsky 5")}
              className="mb-6 active:opacity-70"
            >
              <View className="flex-row items-start mb-3">
                <View className="w-12 h-12 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: "#2a2a2a" }}>
                  <Text className="text-2xl">🐼</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-white text-2xl font-bold">Kandinsky 5</Text>
                  <Text className="text-base mt-1" style={{ color: "#888" }}>
                    Fast, high-quality text-to-video generation
                  </Text>
                </View>
              </View>
              <View className="flex-row flex-wrap">
                <View className="rounded-full px-3 py-1 mr-2 mb-2" style={{ backgroundColor: "#0066FF" }}>
                  <Text className="text-white text-xs font-semibold">New</Text>
                </View>
                <View className="rounded-full px-3 py-1 mr-2 mb-2 flex-row items-center" style={{ backgroundColor: "#2a2a2a" }}>
                  <Ionicons name="tv-outline" size={12} color="#fff" />
                  <Text className="text-white text-xs ml-1">512p-768p</Text>
                </View>
                <View className="rounded-full px-3 py-1 mr-2 mb-2 flex-row items-center" style={{ backgroundColor: "#2a2a2a" }}>
                  <Ionicons name="time-outline" size={12} color="#fff" />
                  <Text className="text-white text-xs ml-1">5s-10s</Text>
                </View>
                <View className="rounded-full px-3 py-1 mb-2 flex-row items-center" style={{ backgroundColor: "#2a2a2a" }}>
                  <Ionicons name="flash" size={12} color="#fff" />
                  <Text className="text-white text-xs ml-1">12 credits</Text>
                </View>
              </View>
            </Pressable>

            {/* Kling 2.5 Turbo */}
            <Pressable
              onPress={() => handleSelectModel("Kling 2.5 Turbo")}
              className="mb-6 active:opacity-70"
            >
              <View className="flex-row items-start mb-3">
                <View className="w-12 h-12 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: "#2a2a2a" }}>
                  <Image source={require("../../assets/kling.png")} style={{ width: 32, height: 32 }} resizeMode="contain" />
                </View>
                <View className="flex-1">
                  <Text className="text-white text-2xl font-bold">Kling 2.5 Turbo</Text>
                  <Text className="text-base mt-1" style={{ color: "#888" }}>
                    Next generation video generation model
                  </Text>
                </View>
              </View>
              <View className="flex-row flex-wrap">
                <View className="rounded-full px-3 py-1 mr-2 mb-2" style={{ backgroundColor: "#0066FF" }}>
                  <Text className="text-white text-xs font-semibold">New</Text>
                </View>
                <View className="rounded-full px-3 py-1 mr-2 mb-2 flex-row items-center" style={{ backgroundColor: "#2a2a2a" }}>
                  <Ionicons name="tv-outline" size={12} color="#fff" />
                  <Text className="text-white text-xs ml-1">720p-1080p</Text>
                </View>
                <View className="rounded-full px-3 py-1 mr-2 mb-2 flex-row items-center" style={{ backgroundColor: "#2a2a2a" }}>
                  <Ionicons name="time-outline" size={12} color="#fff" />
                  <Text className="text-white text-xs ml-1">5s-10s</Text>
                </View>
                <View className="rounded-full px-3 py-1 mb-2 flex-row items-center" style={{ backgroundColor: "#2a2a2a" }}>
                  <Ionicons name="flash" size={12} color="#fff" />
                  <Text className="text-white text-xs ml-1">40 credits</Text>
                </View>
              </View>
            </Pressable>

            {/* MiniMax Hailuo 2.3 Pro */}
            <Pressable
              onPress={() => handleSelectModel("MiniMax Hailuo 2.3 Pro")}
              className="mb-6 active:opacity-70"
            >
              <View className="flex-row items-start mb-3">
                <View className="w-12 h-12 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: "#2a2a2a" }}>
                  <Image source={require("../../assets/minimax.png")} style={{ width: 32, height: 32 }} resizeMode="contain" />
                </View>
                <View className="flex-1">
                  <Text className="text-white text-2xl font-bold">MiniMax Hailuo 2.3 Pro</Text>
                  <Text className="text-base mt-1" style={{ color: "#888" }}>
                    Advanced 1080p video generation model
                  </Text>
                </View>
              </View>
              <View className="flex-row flex-wrap">
                <View className="rounded-full px-3 py-1 mr-2 mb-2" style={{ backgroundColor: "#0066FF" }}>
                  <Text className="text-white text-xs font-semibold">New</Text>
                </View>
                <View className="rounded-full px-3 py-1 mr-2 mb-2 flex-row items-center" style={{ backgroundColor: "#2a2a2a" }}>
                  <Ionicons name="tv-outline" size={12} color="#fff" />
                  <Text className="text-white text-xs ml-1">1080p</Text>
                </View>
                <View className="rounded-full px-3 py-1 mr-2 mb-2 flex-row items-center" style={{ backgroundColor: "#2a2a2a" }}>
                  <Ionicons name="time-outline" size={12} color="#fff" />
                  <Text className="text-white text-xs ml-1">5s</Text>
                </View>
                <View className="rounded-full px-3 py-1 mb-2 flex-row items-center" style={{ backgroundColor: "#2a2a2a" }}>
                  <Ionicons name="flash" size={12} color="#fff" />
                  <Text className="text-white text-xs ml-1">49 credits</Text>
                </View>
              </View>
            </Pressable>

            {/* MiniMax Hailuo 2.3 Standard */}
            <Pressable
              onPress={() => handleSelectModel("MiniMax Hailuo 2.3 Standard")}
              className="mb-6 active:opacity-70"
            >
              <View className="flex-row items-start mb-3">
                <View className="w-12 h-12 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: "#2a2a2a" }}>
                  <Image source={require("../../assets/minimax.png")} style={{ width: 32, height: 32 }} resizeMode="contain" />
                </View>
                <View className="flex-1">
                  <Text className="text-white text-2xl font-bold">MiniMax Hailuo 2.3 Standard</Text>
                  <Text className="text-base mt-1" style={{ color: "#888" }}>
                    High-quality video generation model
                  </Text>
                </View>
              </View>
              <View className="flex-row flex-wrap">
                <View className="rounded-full px-3 py-1 mr-2 mb-2" style={{ backgroundColor: "#0066FF" }}>
                  <Text className="text-white text-xs font-semibold">New</Text>
                </View>
                <View className="rounded-full px-3 py-1 mr-2 mb-2 flex-row items-center" style={{ backgroundColor: "#2a2a2a" }}>
                  <Ionicons name="tv-outline" size={12} color="#fff" />
                  <Text className="text-white text-xs ml-1">720p</Text>
                </View>
                <View className="rounded-full px-3 py-1 mr-2 mb-2 flex-row items-center" style={{ backgroundColor: "#2a2a2a" }}>
                  <Ionicons name="time-outline" size={12} color="#fff" />
                  <Text className="text-white text-xs ml-1">6s-10s</Text>
                </View>
                <View className="rounded-full px-3 py-1 mb-2 flex-row items-center" style={{ backgroundColor: "#2a2a2a" }}>
                  <Ionicons name="flash" size={12} color="#fff" />
                  <Text className="text-white text-xs ml-1">30 credits</Text>
                </View>
              </View>
            </Pressable>

            {/* Seedance Lite */}
            <Pressable
              onPress={() => handleSelectModel("Seedance Lite")}
              className="mb-6 active:opacity-70"
            >
              <View className="flex-row items-start mb-3">
                <View className="w-12 h-12 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: "#2a2a2a" }}>
                  <Image source={require("../../assets/bytedance-color.png")} style={{ width: 32, height: 32 }} resizeMode="contain" />
                </View>
                <View className="flex-1">
                  <Text className="text-white text-2xl font-bold">Seedance Lite</Text>
                  <Text className="text-base mt-1" style={{ color: "#888" }}>
                    {"ByteDance's fast video generation model"}
                  </Text>
                </View>
              </View>
              <View className="flex-row flex-wrap">
                <View className="rounded-full px-3 py-1 mr-2 mb-2" style={{ backgroundColor: "#0066FF" }}>
                  <Text className="text-white text-xs font-semibold">New</Text>
                </View>
                <View className="rounded-full px-3 py-1 mr-2 mb-2 flex-row items-center" style={{ backgroundColor: "#2a2a2a" }}>
                  <Ionicons name="tv-outline" size={12} color="#fff" />
                  <Text className="text-white text-xs ml-1">480p-1080p</Text>
                </View>
                <View className="rounded-full px-3 py-1 mr-2 mb-2 flex-row items-center" style={{ backgroundColor: "#2a2a2a" }}>
                  <Ionicons name="time-outline" size={12} color="#fff" />
                  <Text className="text-white text-xs ml-1">5s-12s</Text>
                </View>
                <View className="rounded-full px-3 py-1 mb-2 flex-row items-center" style={{ backgroundColor: "#2a2a2a" }}>
                  <Ionicons name="flash" size={12} color="#fff" />
                  <Text className="text-white text-xs ml-1">21 credits</Text>
                </View>
              </View>
            </Pressable>

            {/* Seedance Pro */}
            <Pressable
              onPress={() => handleSelectModel("Seedance Pro")}
              className="mb-6 active:opacity-70"
            >
              <View className="flex-row items-start mb-3">
                <View className="w-12 h-12 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: "#2a2a2a" }}>
                  <Image source={require("../../assets/bytedance-color.png")} style={{ width: 32, height: 32 }} resizeMode="contain" />
                </View>
                <View className="flex-1">
                  <Text className="text-white text-2xl font-bold">Seedance Pro</Text>
                  <Text className="text-base mt-1" style={{ color: "#888" }}>
                    {"ByteDance's high-quality video generation"}
                  </Text>
                </View>
              </View>
              <View className="flex-row flex-wrap">
                <View className="rounded-full px-3 py-1 mr-2 mb-2" style={{ backgroundColor: "#0066FF" }}>
                  <Text className="text-white text-xs font-semibold">New</Text>
                </View>
                <View className="rounded-full px-3 py-1 mr-2 mb-2 flex-row items-center" style={{ backgroundColor: "#2a2a2a" }}>
                  <Ionicons name="tv-outline" size={12} color="#fff" />
                  <Text className="text-white text-xs ml-1">480p-1080p</Text>
                </View>
                <View className="rounded-full px-3 py-1 mr-2 mb-2 flex-row items-center" style={{ backgroundColor: "#2a2a2a" }}>
                  <Ionicons name="time-outline" size={12} color="#fff" />
                  <Text className="text-white text-xs ml-1">5s-12s</Text>
                </View>
                <View className="rounded-full px-3 py-1 mb-2 flex-row items-center" style={{ backgroundColor: "#2a2a2a" }}>
                  <Ionicons name="flash" size={12} color="#fff" />
                  <Text className="text-white text-xs ml-1">34 credits</Text>
                </View>
              </View>
            </Pressable>

            {/* Seedance Pro Transition */}
            <Pressable
              onPress={() => handleSelectModel("Seedance Pro Transition")}
              className="mb-6 active:opacity-70"
            >
              <View className="flex-row items-start mb-3">
                <View className="w-12 h-12 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: "#2a2a2a" }}>
                  <Image source={require("../../assets/bytedance-color.png")} style={{ width: 32, height: 32 }} resizeMode="contain" />
                </View>
                <View className="flex-1">
                  <Text className="text-white text-2xl font-bold">Seedance Pro Transition</Text>
                  <Text className="text-base mt-1" style={{ color: "#888" }}>
                    Create seamless transitions between two images
                  </Text>
                </View>
              </View>
              <View className="flex-row flex-wrap">
                <View className="rounded-full px-3 py-1 mr-2 mb-2" style={{ backgroundColor: "#0066FF" }}>
                  <Text className="text-white text-xs font-semibold">New</Text>
                </View>
                <View className="rounded-full px-3 py-1 mr-2 mb-2 flex-row items-center" style={{ backgroundColor: "#2a2a2a" }}>
                  <Ionicons name="tv-outline" size={12} color="#fff" />
                  <Text className="text-white text-xs ml-1">480p-1080p</Text>
                </View>
                <View className="rounded-full px-3 py-1 mr-2 mb-2 flex-row items-center" style={{ backgroundColor: "#2a2a2a" }}>
                  <Ionicons name="time-outline" size={12} color="#fff" />
                  <Text className="text-white text-xs ml-1">5s-12s</Text>
                </View>
                <View className="rounded-full px-3 py-1 mb-2 flex-row items-center" style={{ backgroundColor: "#2a2a2a" }}>
                  <Ionicons name="flash" size={12} color="#fff" />
                  <Text className="text-white text-xs ml-1">34 credits</Text>
                </View>
              </View>
            </Pressable>

            {/* Veo 3.1 */}
            <Pressable
              onPress={() => handleSelectModel("Veo 3.1")}
              className="mb-6 active:opacity-70"
            >
              <View className="flex-row items-start mb-3">
                <View className="w-12 h-12 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: "#2a2a2a" }}>
                  <Image source={require("../../assets/googleg.png")} style={{ width: 32, height: 32 }} resizeMode="contain" />
                </View>
                <View className="flex-1">
                  <Text className="text-white text-2xl font-bold">Veo 3.1</Text>
                  <Text className="text-base mt-1" style={{ color: "#888" }}>
                    Advanced video with sound
                  </Text>
                </View>
              </View>
              <View className="flex-row flex-wrap">
                <View className="rounded-full px-3 py-1 mr-2 mb-2" style={{ backgroundColor: "#0066FF" }}>
                  <Text className="text-white text-xs font-semibold">New</Text>
                </View>
                <View className="rounded-full px-3 py-1 mr-2 mb-2 flex-row items-center" style={{ backgroundColor: "#2a2a2a" }}>
                  <Ionicons name="tv-outline" size={12} color="#fff" />
                  <Text className="text-white text-xs ml-1">720p</Text>
                </View>
                <View className="rounded-full px-3 py-1 mr-2 mb-2 flex-row items-center" style={{ backgroundColor: "#2a2a2a" }}>
                  <Ionicons name="time-outline" size={12} color="#fff" />
                  <Text className="text-white text-xs ml-1">4s-12s</Text>
                </View>
                <View className="rounded-full px-3 py-1 mr-2 mb-2 flex-row items-center" style={{ backgroundColor: "#2a2a2a" }}>
                  <Ionicons name="musical-notes-outline" size={12} color="#fff" />
                  <Text className="text-white text-xs ml-1">Audio</Text>
                </View>
                <View className="rounded-full px-3 py-1 mb-2 flex-row items-center" style={{ backgroundColor: "#2a2a2a" }}>
                  <Ionicons name="flash" size={12} color="#fff" />
                  <Text className="text-white text-xs ml-1">240 credits</Text>
                </View>
              </View>
            </Pressable>

            {/* Veo 3.1 Transition */}
            <Pressable
              onPress={() => handleSelectModel("Veo 3.1 Transition")}
              className="mb-6 active:opacity-70"
            >
              <View className="flex-row items-start mb-3">
                <View className="w-12 h-12 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: "#2a2a2a" }}>
                  <Image source={require("../../assets/googleg.png")} style={{ width: 32, height: 32 }} resizeMode="contain" />
                </View>
                <View className="flex-1">
                  <Text className="text-white text-2xl font-bold">Veo 3.1 Transition</Text>
                  <Text className="text-base mt-1" style={{ color: "#888" }}>
                    Create seamless transitions between two images
                  </Text>
                </View>
              </View>
              <View className="flex-row flex-wrap">
                <View className="rounded-full px-3 py-1 mr-2 mb-2" style={{ backgroundColor: "#0066FF" }}>
                  <Text className="text-white text-xs font-semibold">New</Text>
                </View>
                <View className="rounded-full px-3 py-1 mr-2 mb-2 flex-row items-center" style={{ backgroundColor: "#2a2a2a" }}>
                  <Ionicons name="tv-outline" size={12} color="#fff" />
                  <Text className="text-white text-xs ml-1">720p-1080p</Text>
                </View>
                <View className="rounded-full px-3 py-1 mr-2 mb-2 flex-row items-center" style={{ backgroundColor: "#2a2a2a" }}>
                  <Ionicons name="time-outline" size={12} color="#fff" />
                  <Text className="text-white text-xs ml-1">8s</Text>
                </View>
                <View className="rounded-full px-3 py-1 mr-2 mb-2 flex-row items-center" style={{ backgroundColor: "#2a2a2a" }}>
                  <Ionicons name="musical-notes-outline" size={12} color="#fff" />
                  <Text className="text-white text-xs ml-1">Audio</Text>
                </View>
                <View className="rounded-full px-3 py-1 mb-2 flex-row items-center" style={{ backgroundColor: "#2a2a2a" }}>
                  <Ionicons name="flash" size={12} color="#fff" />
                  <Text className="text-white text-xs ml-1">240 credits</Text>
                </View>
              </View>
            </Pressable>

            {/* Veo 3.1 Fast */}
            <Pressable
              onPress={() => handleSelectModel("Veo 3.1 Fast")}
              className="mb-6 active:opacity-70"
            >
              <View className="flex-row items-start mb-3">
                <View className="w-12 h-12 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: "#2a2a2a" }}>
                  <Image source={require("../../assets/googleg.png")} style={{ width: 32, height: 32 }} resizeMode="contain" />
                </View>
                <View className="flex-1">
                  <Text className="text-white text-2xl font-bold">Veo 3.1 Fast</Text>
                  <Text className="text-base mt-1" style={{ color: "#888" }}>
                    Faster, cost-effective Veo 3.1
                  </Text>
                </View>
              </View>
              <View className="flex-row flex-wrap">
                <View className="rounded-full px-3 py-1 mr-2 mb-2" style={{ backgroundColor: "#0066FF" }}>
                  <Text className="text-white text-xs font-semibold">New</Text>
                </View>
                <View className="rounded-full px-3 py-1 mr-2 mb-2 flex-row items-center" style={{ backgroundColor: "#2a2a2a" }}>
                  <Ionicons name="tv-outline" size={12} color="#fff" />
                  <Text className="text-white text-xs ml-1">720p</Text>
                </View>
                <View className="rounded-full px-3 py-1 mr-2 mb-2 flex-row items-center" style={{ backgroundColor: "#2a2a2a" }}>
                  <Ionicons name="time-outline" size={12} color="#fff" />
                  <Text className="text-white text-xs ml-1">4s-12s</Text>
                </View>
                <View className="rounded-full px-3 py-1 mr-2 mb-2 flex-row items-center" style={{ backgroundColor: "#2a2a2a" }}>
                  <Ionicons name="musical-notes-outline" size={12} color="#fff" />
                  <Text className="text-white text-xs ml-1">Audio</Text>
                </View>
                <View className="rounded-full px-3 py-1 mb-2 flex-row items-center" style={{ backgroundColor: "#2a2a2a" }}>
                  <Ionicons name="flash" size={12} color="#fff" />
                  <Text className="text-white text-xs ml-1">108 credits</Text>
                </View>
              </View>
            </Pressable>

            {/* Veo 3.1 Fast Transition */}
            <Pressable
              onPress={() => handleSelectModel("Veo 3.1 Fast Transition")}
              className="mb-6 active:opacity-70"
            >
              <View className="flex-row items-start mb-3">
                <View className="w-12 h-12 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: "#2a2a2a" }}>
                  <Image source={require("../../assets/googleg.png")} style={{ width: 32, height: 32 }} resizeMode="contain" />
                </View>
                <View className="flex-1">
                  <Text className="text-white text-2xl font-bold">Veo 3.1 Fast Transition</Text>
                  <Text className="text-base mt-1" style={{ color: "#888" }}>
                    Create seamless transitions between two images
                  </Text>
                </View>
              </View>
              <View className="flex-row flex-wrap">
                <View className="rounded-full px-3 py-1 mr-2 mb-2" style={{ backgroundColor: "#0066FF" }}>
                  <Text className="text-white text-xs font-semibold">New</Text>
                </View>
                <View className="rounded-full px-3 py-1 mr-2 mb-2 flex-row items-center" style={{ backgroundColor: "#2a2a2a" }}>
                  <Ionicons name="tv-outline" size={12} color="#fff" />
                  <Text className="text-white text-xs ml-1">720p-1080p</Text>
                </View>
                <View className="rounded-full px-3 py-1 mr-2 mb-2 flex-row items-center" style={{ backgroundColor: "#2a2a2a" }}>
                  <Ionicons name="time-outline" size={12} color="#fff" />
                  <Text className="text-white text-xs ml-1">8s</Text>
                </View>
                <View className="rounded-full px-3 py-1 mr-2 mb-2 flex-row items-center" style={{ backgroundColor: "#2a2a2a" }}>
                  <Ionicons name="musical-notes-outline" size={12} color="#fff" />
                  <Text className="text-white text-xs ml-1">Audio</Text>
                </View>
                <View className="rounded-full px-3 py-1 mb-2 flex-row items-center" style={{ backgroundColor: "#2a2a2a" }}>
                  <Ionicons name="flash" size={12} color="#fff" />
                  <Text className="text-white text-xs ml-1">108 credits</Text>
                </View>
              </View>
            </Pressable>

            {/* Pixverse v5 */}
            <Pressable
              onPress={() => handleSelectModel("Pixverse v5")}
              className="mb-6 active:opacity-70"
            >
              <View className="flex-row items-start mb-3">
                <View className="w-12 h-12 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: "#2a2a2a" }}>
                  <Text className="text-2xl">🎬</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-white text-2xl font-bold">Pixverse v5</Text>
                  <Text className="text-base mt-1" style={{ color: "#888" }}>
                    High-quality text/image-to-video
                  </Text>
                </View>
              </View>
              <View className="flex-row flex-wrap">
                <View className="rounded-full px-3 py-1 mr-2 mb-2 flex-row items-center" style={{ backgroundColor: "#2a2a2a" }}>
                  <Ionicons name="tv-outline" size={12} color="#fff" />
                  <Text className="text-white text-xs ml-1">360p-1080p</Text>
                </View>
                <View className="rounded-full px-3 py-1 mr-2 mb-2 flex-row items-center" style={{ backgroundColor: "#2a2a2a" }}>
                  <Ionicons name="time-outline" size={12} color="#fff" />
                  <Text className="text-white text-xs ml-1">5s-8s</Text>
                </View>
                <View className="rounded-full px-3 py-1 mb-2 flex-row items-center" style={{ backgroundColor: "#2a2a2a" }}>
                  <Ionicons name="flash" size={12} color="#fff" />
                  <Text className="text-white text-xs ml-1">16 credits</Text>
                </View>
              </View>
            </Pressable>

            {/* Pixverse v5 Transition */}
            <Pressable
              onPress={() => handleSelectModel("Pixverse v5 Transition")}
              className="mb-6 active:opacity-70"
            >
              <View className="flex-row items-start mb-3">
                <View className="w-12 h-12 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: "#2a2a2a" }}>
                  <Text className="text-2xl">🎬</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-white text-2xl font-bold">Pixverse v5 Transition</Text>
                  <Text className="text-base mt-1" style={{ color: "#888" }}>
                    Seamless transitions
                  </Text>
                </View>
              </View>
              <View className="flex-row flex-wrap">
                <View className="rounded-full px-3 py-1 mr-2 mb-2 flex-row items-center" style={{ backgroundColor: "#2a2a2a" }}>
                  <Ionicons name="tv-outline" size={12} color="#fff" />
                  <Text className="text-white text-xs ml-1">360p-1080p</Text>
                </View>
                <View className="rounded-full px-3 py-1 mr-2 mb-2 flex-row items-center" style={{ backgroundColor: "#2a2a2a" }}>
                  <Ionicons name="time-outline" size={12} color="#fff" />
                  <Text className="text-white text-xs ml-1">5s-8s</Text>
                </View>
                <View className="rounded-full px-3 py-1 mb-2 flex-row items-center" style={{ backgroundColor: "#2a2a2a" }}>
                  <Ionicons name="flash" size={12} color="#fff" />
                  <Text className="text-white text-xs ml-1">16 credits</Text>
                </View>
              </View>
            </Pressable>

            {/* Lucy Lite */}
            <Pressable
              onPress={() => handleSelectModel("Lucy Lite")}
              className="mb-6 active:opacity-70"
            >
              <View className="flex-row items-start mb-3">
                <View className="w-12 h-12 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: "#2a2a2a" }}>
                  <Image source={require("../../assets/foreverai.png")} style={{ width: 32, height: 32 }} resizeMode="contain" />
                </View>
                <View className="flex-1">
                  <Text className="text-white text-2xl font-bold">Lucy Lite</Text>
                  <Text className="text-base mt-1" style={{ color: "#888" }}>
                    Fast 3s image-to-video
                  </Text>
                </View>
              </View>
              <View className="flex-row flex-wrap">
                <View className="rounded-full px-3 py-1 mr-2 mb-2 flex-row items-center" style={{ backgroundColor: "#2a2a2a" }}>
                  <Ionicons name="tv-outline" size={12} color="#fff" />
                  <Text className="text-white text-xs ml-1">720p</Text>
                </View>
                <View className="rounded-full px-3 py-1 mr-2 mb-2 flex-row items-center" style={{ backgroundColor: "#2a2a2a" }}>
                  <Ionicons name="time-outline" size={12} color="#fff" />
                  <Text className="text-white text-xs ml-1">3s</Text>
                </View>
                <View className="rounded-full px-3 py-1 mb-2 flex-row items-center" style={{ backgroundColor: "#2a2a2a" }}>
                  <Ionicons name="flash" size={12} color="#fff" />
                  <Text className="text-white text-xs ml-1">16 credits</Text>
                </View>
              </View>
            </Pressable>

            {/* Lucy Pro */}
            <Pressable
              onPress={() => handleSelectModel("Lucy Pro")}
              className="mb-6 active:opacity-70"
            >
              <View className="flex-row items-start mb-3">
                <View className="w-12 h-12 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: "#2a2a2a" }}>
                  <Image source={require("../../assets/foreverai.png")} style={{ width: 32, height: 32 }} resizeMode="contain" />
                </View>
                <View className="flex-1">
                  <Text className="text-white text-2xl font-bold">Lucy Pro</Text>
                  <Text className="text-base mt-1" style={{ color: "#888" }}>
                    High-quality 5s image-to-video
                  </Text>
                </View>
              </View>
              <View className="flex-row flex-wrap">
                <View className="rounded-full px-3 py-1 mr-2 mb-2 flex-row items-center" style={{ backgroundColor: "#2a2a2a" }}>
                  <Ionicons name="tv-outline" size={12} color="#fff" />
                  <Text className="text-white text-xs ml-1">720p-1080p</Text>
                </View>
                <View className="rounded-full px-3 py-1 mr-2 mb-2 flex-row items-center" style={{ backgroundColor: "#2a2a2a" }}>
                  <Ionicons name="time-outline" size={12} color="#fff" />
                  <Text className="text-white text-xs ml-1">5s</Text>
                </View>
                <View className="rounded-full px-3 py-1 mb-2 flex-row items-center" style={{ backgroundColor: "#2a2a2a" }}>
                  <Ionicons name="flash" size={12} color="#fff" />
                  <Text className="text-white text-xs ml-1">32 credits</Text>
                </View>
              </View>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
