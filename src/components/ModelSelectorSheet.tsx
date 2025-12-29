import React, { useCallback, useMemo, forwardRef, useRef, useState } from "react";
import { View, Text, Pressable, useWindowDimensions, TextInput } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetModal, BottomSheetFlatList, BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IMAGE_MODELS, getSortedModels, ImageModelId, ImageModelMeta } from "../config/imageModels";

interface Badge {
  type: "new" | "edit" | "credits" | "resolution" | "quality";
  label?: string;
}

interface ModelItem {
  id: ImageModelId;
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
  "flux": require("../../assets/flux.png"),
  "bytedance-color": require("../../assets/bytedance-color.png"),
  "donereve": require("../../assets/donereve.png"),
  "hunyuan": require("../../assets/bytedance-color.png"), // fallback
  "kling": require("../../assets/bytedance-color.png"), // fallback
};

// Logo tint colors (for dark icons that need white tint)
const LOGO_TINTS: Record<string, string | undefined> = {
  "openai": "#fff",
  "flux": "#fff",
};

// Convert ImageModelMeta to ModelItem
function modelMetaToItem(meta: ImageModelMeta): ModelItem {
  const badges: Badge[] = [];
  
  if (meta.isNew) {
    badges.push({ type: "new" });
  }
  
  if (meta.requiresAttachment) {
    badges.push({ type: "edit" });
  }
  
  if (meta.supportsResolution) {
    badges.push({ type: "resolution", label: "1K/2K/4K" });
  }
  
  if (meta.supportsQuality) {
    badges.push({ type: "quality", label: "Quality" });
  }
  
  badges.push({ type: "credits", label: `${meta.creditCost} credits` });
  
  return {
    id: meta.id,
    name: meta.label,
    description: meta.description,
    icon: LOGO_ASSETS[meta.logo] || LOGO_ASSETS["googleg"],
    tintColor: LOGO_TINTS[meta.logo],
    badges,
  };
}

// Get all models as ModelItems, sorted
const models: ModelItem[] = getSortedModels().map(modelMetaToItem);

interface Props {
  onSelectModel: (modelId: ImageModelId, modelLabel: string) => void;
  selectedModelId?: ImageModelId;
}

const ModelSelectorSheet = forwardRef<BottomSheetModal, Props>(({ onSelectModel, selectedModelId }, ref) => {
  const internalRef = useRef<BottomSheetModal>(null);
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const snapPoints = useMemo(() => [height * 1 - insets.top], [height, insets.top]);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter models based on search
  const filteredModels = useMemo(() => {
    if (!searchQuery.trim()) return models;
    const query = searchQuery.toLowerCase();
    return models.filter(
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

  const handleSelectModel = useCallback((modelId: ImageModelId, modelLabel: string) => {
    onSelectModel(modelId, modelLabel);
    setSearchQuery("");
    internalRef.current?.dismiss();
  }, [onSelectModel]);

  const renderItem = useCallback(({ item }: { item: ModelItem }) => (
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
        {item.badges.map((badge, index) => {
          if (badge.type === "new") {
            return (
              <View key={index} className="rounded-full px-2.5 py-1 mr-2 mb-1" style={{ backgroundColor: "#0066FF" }}>
                <Text className="text-white text-xs font-semibold">New</Text>
              </View>
            );
          }
          if (badge.type === "edit") {
            return (
              <View key={index} className="rounded-full px-2.5 py-1 mr-2 mb-1 flex-row items-center" style={{ backgroundColor: "#2a2a2a" }}>
                <Ionicons name="create-outline" size={11} color="#fff" />
                <Text className="text-white text-xs ml-1">Edit</Text>
              </View>
            );
          }
          if (badge.type === "credits") {
            return (
              <View key={index} className="rounded-full px-2.5 py-1 mr-2 mb-1 flex-row items-center" style={{ backgroundColor: "#2a2a2a" }}>
                <Ionicons name="flash" size={11} color="#fff" />
                <Text className="text-white text-xs ml-1">{badge.label}</Text>
              </View>
            );
          }
          if (badge.type === "resolution") {
            return (
              <View key={index} className="rounded-full px-2.5 py-1 mr-2 mb-1 flex-row items-center" style={{ backgroundColor: "#2a2a2a" }}>
                <Ionicons name="resize-outline" size={11} color="#fff" />
                <Text className="text-white text-xs ml-1">{badge.label}</Text>
              </View>
            );
          }
          if (badge.type === "quality") {
            return (
              <View key={index} className="rounded-full px-2.5 py-1 mr-2 mb-1 flex-row items-center" style={{ backgroundColor: "#2a2a2a" }}>
                <Ionicons name="star-outline" size={11} color="#fff" />
                <Text className="text-white text-xs ml-1">{badge.label}</Text>
              </View>
            );
          }
          return null;
        })}
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
            placeholder="Search models..."
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

export default ModelSelectorSheet;
