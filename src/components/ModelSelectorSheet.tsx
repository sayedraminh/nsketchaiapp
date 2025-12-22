import React, { useCallback, useMemo, forwardRef } from "react";
import { View, Text, Pressable, Image, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetModal, BottomSheetFlatList, BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Badge {
  type: "new" | "edit" | "credits";
  label?: string;
}

interface ModelItem {
  id: string;
  name: string;
  description: string;
  icon: any;
  tintColor?: string;
  badges: Badge[];
}

const models: ModelItem[] = [
  { id: "1", name: "Seedream v4", description: "High-res 2K+ with strong text layout", icon: require("../../assets/decart.png"), badges: [{ type: "new" }, { type: "credits", label: "3 credits" }] },
  { id: "2", name: "Seedream v4 Edit", description: "Multi-image editing (up to 10 refs)", icon: require("../../assets/decart.png"), badges: [{ type: "new" }, { type: "edit" }, { type: "credits", label: "3 credits" }] },
  { id: "3", name: "Reve", description: "Detailed visual output with strong aesthetic", icon: require("../../assets/donereve.png"), badges: [{ type: "new" }, { type: "credits", label: "3 credits" }] },
  { id: "4", name: "Reve Edit", description: "Edit and transform images with text", icon: require("../../assets/donereve.png"), badges: [{ type: "new" }, { type: "edit" }, { type: "credits", label: "3 credits" }] },
  { id: "5", name: "Hunyuan Image 3.0", description: "Tencent's latest text-to-image model", icon: require("../../assets/bytedance-color.png"), badges: [{ type: "new" }, { type: "credits", label: "3 credits" }] },
  { id: "6", name: "FLUX Kontext Pro", description: "Powerful image-to-image editing", icon: require("../../assets/flux.png"), tintColor: "#fff", badges: [{ type: "edit" }, { type: "credits", label: "3 credits" }] },
  { id: "7", name: "Imagen 4", description: "Fast, reliable text-to-image", icon: require("../../assets/googleg.png"), badges: [{ type: "credits", label: "3 credits" }] },
  { id: "8", name: "Imagen 3", description: "Google's most realistic image generation", icon: require("../../assets/googleg.png"), badges: [{ type: "credits", label: "3 credits" }] },
  { id: "9", name: "Nano Banana", description: "Fast text-to-image with aspect ratios", icon: require("../../assets/googleg.png"), badges: [{ type: "credits", label: "3 credits" }] },
  { id: "10", name: "Nano Banana Edit", description: "Edit with up to 10 reference images", icon: require("../../assets/googleg.png"), badges: [{ type: "edit" }, { type: "credits", label: "3 credits" }] },
  { id: "11", name: "GPT-Image 1", description: "OpenAI text-to-image", icon: require("../../assets/openai.png"), tintColor: "#fff", badges: [{ type: "credits", label: "3 credits" }] },
  { id: "12", name: "GPT-Image 1 Edit", description: "OpenAI image editing", icon: require("../../assets/openai.png"), tintColor: "#fff", badges: [{ type: "edit" }, { type: "credits", label: "3 credits" }] },
];

interface Props {
  onSelectModel: (model: string) => void;
}

const ModelSelectorSheet = forwardRef<BottomSheetModal, Props>(({ onSelectModel }, ref) => {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const snapPoints = useMemo(() => [height * 1 - insets.top], [height, insets.top]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
    ),
    []
  );

  const handleSelectModel = useCallback((modelName: string) => {
    onSelectModel(modelName);
    (ref as React.RefObject<BottomSheetModal>)?.current?.dismiss();
  }, [onSelectModel, ref]);

  const renderItem = useCallback(({ item }: { item: ModelItem }) => (
    <Pressable
      onPress={() => handleSelectModel(item.name)}
      className="mb-5 active:opacity-70"
    >
      <View className="flex-row items-start mb-2">
        <View className="w-11 h-11 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: "#2a2a2a" }}>
          <Image 
            source={item.icon} 
            style={{ width: 28, height: 28, ...(item.tintColor ? { tintColor: item.tintColor } : {}) }} 
            resizeMode="contain" 
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
          return null;
        })}
      </View>
    </Pressable>
  ), [handleSelectModel]);

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={snapPoints}
      enableDynamicSizing={false}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: "#1a1a1a" }}
      handleComponent={() => null}
      topInset={insets.top}
    >
      <BottomSheetFlatList
        data={models}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 40 }}
      />
    </BottomSheetModal>
  );
});

export default ModelSelectorSheet;
