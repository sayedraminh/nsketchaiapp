import React, { useCallback, useMemo, forwardRef, useRef } from "react";
import { View, Text, Pressable, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetModal, BottomSheetFlatList, BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Badge {
  type: "new" | "resolution" | "duration" | "audio" | "credits";
  label?: string;
}

interface VideoModelItem {
  id: string;
  name: string;
  description: string;
  icon: any;
  iconType: "image" | "emoji";
  emoji?: string;
  badges: Badge[];
}

const videoModels: VideoModelItem[] = [
  { id: "1", name: "Sora 2", description: "OpenAI's state-of-the-art video generation", icon: require("../../assets/sora.png"), iconType: "image", badges: [{ type: "new" }, { type: "resolution", label: "720p" }, { type: "duration", label: "10s-15s" }, { type: "credits", label: "30 credits" }] },
  { id: "2", name: "Ovi", description: "Unified audio-video generation with sound", icon: require("../../assets/ovi.png"), iconType: "image", badges: [{ type: "new" }, { type: "resolution", label: "Various" }, { type: "duration", label: "5s" }, { type: "audio" }, { type: "credits", label: "21 credits" }] },
  { id: "3", name: "Kandinsky 5", description: "Fast, high-quality text-to-video", icon: null, iconType: "emoji", emoji: "🐼", badges: [{ type: "new" }, { type: "resolution", label: "512p-768p" }, { type: "duration", label: "5s-10s" }, { type: "credits", label: "12 credits" }] },
  { id: "4", name: "Kling 2.5 Turbo", description: "Next generation video generation", icon: require("../../assets/kling.png"), iconType: "image", badges: [{ type: "new" }, { type: "resolution", label: "720p-1080p" }, { type: "duration", label: "5s-10s" }, { type: "credits", label: "40 credits" }] },
  { id: "5", name: "MiniMax Hailuo 2.3 Pro", description: "Advanced 1080p video generation", icon: require("../../assets/minimax.png"), iconType: "image", badges: [{ type: "new" }, { type: "resolution", label: "1080p" }, { type: "duration", label: "5s" }, { type: "credits", label: "49 credits" }] },
  { id: "6", name: "MiniMax Hailuo 2.3 Standard", description: "High-quality video generation", icon: require("../../assets/minimax.png"), iconType: "image", badges: [{ type: "new" }, { type: "resolution", label: "720p" }, { type: "duration", label: "6s-10s" }, { type: "credits", label: "30 credits" }] },
  { id: "7", name: "Seedance Lite", description: "ByteDance's fast video generation", icon: require("../../assets/bytedance-color.png"), iconType: "image", badges: [{ type: "new" }, { type: "resolution", label: "480p-1080p" }, { type: "duration", label: "5s-12s" }, { type: "credits", label: "21 credits" }] },
  { id: "8", name: "Seedance Pro", description: "ByteDance's high-quality video", icon: require("../../assets/bytedance-color.png"), iconType: "image", badges: [{ type: "new" }, { type: "resolution", label: "480p-1080p" }, { type: "duration", label: "5s-12s" }, { type: "credits", label: "34 credits" }] },
  { id: "9", name: "Veo 3.1", description: "Advanced video with sound", icon: require("../../assets/googleg.png"), iconType: "image", badges: [{ type: "new" }, { type: "resolution", label: "720p" }, { type: "duration", label: "4s-12s" }, { type: "audio" }, { type: "credits", label: "240 credits" }] },
  { id: "10", name: "Veo 3.1 Fast", description: "Faster, cost-effective Veo 3.1", icon: require("../../assets/googleg.png"), iconType: "image", badges: [{ type: "new" }, { type: "resolution", label: "720p" }, { type: "duration", label: "4s-12s" }, { type: "audio" }, { type: "credits", label: "108 credits" }] },
  { id: "11", name: "Pixverse v5", description: "High-quality text/image-to-video", icon: null, iconType: "emoji", emoji: "🎬", badges: [{ type: "resolution", label: "360p-1080p" }, { type: "duration", label: "5s-8s" }, { type: "credits", label: "16 credits" }] },
  { id: "12", name: "Lucy Lite", description: "Fast 3s image-to-video", icon: require("../../assets/foreverai.png"), iconType: "image", badges: [{ type: "resolution", label: "720p" }, { type: "duration", label: "3s" }, { type: "credits", label: "16 credits" }] },
  { id: "13", name: "Lucy Pro", description: "High-quality 5s image-to-video", icon: require("../../assets/foreverai.png"), iconType: "image", badges: [{ type: "resolution", label: "720p-1080p" }, { type: "duration", label: "5s" }, { type: "credits", label: "32 credits" }] },
];

interface Props {
  onSelectModel: (model: string) => void;
}

const VideoModelSelectorSheet = forwardRef<BottomSheetModal, Props>(({ onSelectModel }, ref) => {
  const internalRef = useRef<BottomSheetModal>(null);
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const snapPoints = useMemo(() => [height * 1 - insets.top], [height, insets.top]);

  // Sync internal ref with forwarded ref
  const setRef = useCallback((instance: BottomSheetModal | null) => {
    internalRef.current = instance;
    if (typeof ref === 'function') {
      ref(instance);
    } else if (ref) {
      ref.current = instance;
    }
  }, [ref]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
    ),
    []
  );

  const handleSelectModel = useCallback((modelName: string) => {
    onSelectModel(modelName);
    internalRef.current?.dismiss();
  }, [onSelectModel]);

  const renderBadge = (badge: Badge, index: number) => {
    switch (badge.type) {
      case "new":
        return (
          <View key={index} className="rounded-full px-2.5 py-1 mr-1.5 mb-1" style={{ backgroundColor: "#0066FF" }}>
            <Text className="text-white text-xs font-semibold">New</Text>
          </View>
        );
      case "resolution":
        return (
          <View key={index} className="rounded-full px-2.5 py-1 mr-1.5 mb-1 flex-row items-center" style={{ backgroundColor: "#2a2a2a" }}>
            <Ionicons name="tv-outline" size={11} color="#fff" />
            <Text className="text-white text-xs ml-1">{badge.label}</Text>
          </View>
        );
      case "duration":
        return (
          <View key={index} className="rounded-full px-2.5 py-1 mr-1.5 mb-1 flex-row items-center" style={{ backgroundColor: "#2a2a2a" }}>
            <Ionicons name="time-outline" size={11} color="#fff" />
            <Text className="text-white text-xs ml-1">{badge.label}</Text>
          </View>
        );
      case "audio":
        return (
          <View key={index} className="rounded-full px-2.5 py-1 mr-1.5 mb-1 flex-row items-center" style={{ backgroundColor: "#2a2a2a" }}>
            <Ionicons name="musical-notes-outline" size={11} color="#fff" />
            <Text className="text-white text-xs ml-1">Audio</Text>
          </View>
        );
      case "credits":
        return (
          <View key={index} className="rounded-full px-2.5 py-1 mr-1.5 mb-1 flex-row items-center" style={{ backgroundColor: "#2a2a2a" }}>
            <Ionicons name="flash" size={11} color="#fff" />
            <Text className="text-white text-xs ml-1">{badge.label}</Text>
          </View>
        );
      default:
        return null;
    }
  };

  const renderItem = useCallback(({ item }: { item: VideoModelItem }) => (
    <Pressable
      onPress={() => handleSelectModel(item.name)}
      className="mb-5 active:opacity-70"
    >
      <View className="flex-row items-start mb-2">
        <View className="w-11 h-11 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: "#2a2a2a" }}>
          {item.iconType === "emoji" ? (
            <Text className="text-xl">{item.emoji}</Text>
          ) : (
            <Image source={item.icon} style={{ width: 28, height: 28 }} contentFit="contain" />
          )}
        </View>
        <View className="flex-1">
          <Text className="text-white text-xl font-bold">{item.name}</Text>
          <Text className="text-sm mt-0.5" style={{ color: "#888" }}>{item.description}</Text>
        </View>
      </View>
      <View className="flex-row flex-wrap ml-14">
        {item.badges.map((badge, index) => renderBadge(badge, index))}
      </View>
    </Pressable>
  ), [handleSelectModel]);

  return (
    <BottomSheetModal
      ref={setRef}
      snapPoints={snapPoints}
      enableDynamicSizing={false}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: "#1a1a1a" }}
      handleComponent={() => null}
      topInset={insets.top}
    >
      <BottomSheetFlatList
        data={videoModels}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 40 }}
      />
    </BottomSheetModal>
  );
});

export default VideoModelSelectorSheet;
