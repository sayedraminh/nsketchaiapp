import React, { useCallback, useMemo, forwardRef, useRef, useState } from "react";
import { View, Text, Pressable, useWindowDimensions, TextInput } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetModal, BottomSheetFlatList, BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { 
  VIDEO_MODELS, 
  getSortedVideoModels, 
  VideoModelId, 
  VideoModelMeta,
} from "../config/videoModels";

interface Badge {
  type: "new" | "resolution" | "duration" | "audio" | "credits" | "i2v" | "transition";
  label?: string;
}

interface VideoModelItem {
  id: VideoModelId;
  name: string;
  description: string;
  icon: any;
  tintColor?: string;
  badges: Badge[];
}

// Logo assets mapping
const LOGO_ASSETS: Record<string, any> = {
  "openai": require("../../assets/openai.png"),
  "googleg": require("../../assets/googleg.png"),
  "bytedance-color": require("../../assets/bytedance-color.png"),
  "kling": require("../../assets/bytedance-color.png"),
  "alibaba": require("../../assets/bytedance-color.png"),
  "minimax": require("../../assets/minimax.png"),
  "luma": require("../../assets/foreverai.png"),
  "sber": require("../../assets/bytedance-color.png"),
};

// Logo tint colors (for dark icons that need white tint)
const LOGO_TINTS: Record<string, string | undefined> = {
  "openai": "#fff",
};

// Convert VideoModelMeta to VideoModelItem
function modelMetaToItem(meta: VideoModelMeta): VideoModelItem {
  const badges: Badge[] = [];
  
  if (meta.isNew) {
    badges.push({ type: "new" });
  }
  
  if (meta.requiresAttachment && !meta.isTransition) {
    badges.push({ type: "i2v" });
  }
  
  if (meta.isTransition) {
    badges.push({ type: "transition" });
  }
  
  if (meta.supportsAudio) {
    badges.push({ type: "audio" });
  }
  
  // Resolution badge
  const resolutions = meta.allowedResolutions?.join("/") || "720p";
  badges.push({ type: "resolution", label: resolutions });
  
  // Duration badge
  const durations = meta.allowedDurations;
  const durationLabel = durations.length > 1 
    ? `${Math.min(...durations)}s-${Math.max(...durations)}s`
    : `${durations[0]}s`;
  badges.push({ type: "duration", label: durationLabel });
  
  badges.push({ type: "credits", label: `${meta.baseCreditCost} credits` });
  
  return {
    id: meta.id,
    name: meta.label,
    description: meta.description,
    icon: LOGO_ASSETS[meta.logo] || LOGO_ASSETS["googleg"],
    tintColor: LOGO_TINTS[meta.logo],
    badges,
  };
}

// Get all models as VideoModelItems, sorted
const videoModels: VideoModelItem[] = getSortedVideoModels().map(modelMetaToItem);

interface Props {
  onSelectModel: (modelId: VideoModelId, modelLabel: string) => void;
  selectedModelId?: VideoModelId;
}

const VideoModelSelectorSheet = forwardRef<BottomSheetModal, Props>(({ onSelectModel, selectedModelId }, ref) => {
  const internalRef = useRef<BottomSheetModal>(null);
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const snapPoints = useMemo(() => [height * 1 - insets.top], [height, insets.top]);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter models based on search
  const filteredModels = useMemo(() => {
    if (!searchQuery.trim()) return videoModels;
    const query = searchQuery.toLowerCase();
    return videoModels.filter(
      (m) =>
        m.name.toLowerCase().includes(query) ||
        m.description.toLowerCase().includes(query)
    );
  }, [searchQuery]);

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

  const handleSelectModel = useCallback((modelId: VideoModelId, modelLabel: string) => {
    onSelectModel(modelId, modelLabel);
    setSearchQuery("");
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
      case "i2v":
        return (
          <View key={index} className="rounded-full px-2.5 py-1 mr-1.5 mb-1 flex-row items-center" style={{ backgroundColor: "#2a2a2a" }}>
            <Ionicons name="image-outline" size={11} color="#fff" />
            <Text className="text-white text-xs ml-1">I2V</Text>
          </View>
        );
      case "transition":
        return (
          <View key={index} className="rounded-full px-2.5 py-1 mr-1.5 mb-1 flex-row items-center" style={{ backgroundColor: "#2a2a2a" }}>
            <Ionicons name="swap-horizontal-outline" size={11} color="#fff" />
            <Text className="text-white text-xs ml-1">Transition</Text>
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
      onPress={() => handleSelectModel(item.id, item.name)}
      className="mb-5 active:opacity-70"
    >
      <View className="flex-row items-start mb-2">
        <View className="w-11 h-11 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: "#2a2a2a" }}>
          <Image 
            source={item.icon} 
            style={{ width: 28, height: 28, ...(item.tintColor ? { tintColor: item.tintColor } : {}) }} 
            contentFit="contain" 
          />
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
      <View className="px-5 pt-4 pb-3">
        <View className="flex-row items-center bg-neutral-800 rounded-xl px-4 py-3">
          <Ionicons name="search" size={18} color="#9ca3af" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search video models..."
            placeholderTextColor="#9ca3af"
            className="flex-1 text-white text-base ml-2"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")} className="p-1">
              <Ionicons name="close-circle" size={18} color="#9ca3af" />
            </Pressable>
          )}
        </View>
      </View>
      <BottomSheetFlatList
        data={filteredModels}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        ListEmptyComponent={
          <View className="items-center py-10">
            <Ionicons name="search-outline" size={48} color="#4b5563" />
            <Text className="text-gray-500 mt-3">No models found</Text>
          </View>
        }
      />
    </BottomSheetModal>
  );
});

export default VideoModelSelectorSheet;
