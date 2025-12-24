import React, { useState, useRef, useCallback, useEffect } from "react";
import { View, Text, Pressable, ScrollView, TextInput, Platform, UIManager, Image, Keyboard, InteractionManager } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { MenuView } from "@react-native-menu/menu";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from "react-native-reanimated";
import * as ImagePicker from "expo-image-picker";
import ModelSelectorSheet from "../components/ModelSelectorSheet";

// Enable LayoutAnimation on Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function ImagesScreen() {
  const insets = useSafeAreaInsets();
  const [prompt, setPrompt] = useState("");
  const [selectedAspectRatio, setSelectedAspectRatio] = useState("2:3");
  const [numberOfImages, setNumberOfImages] = useState(1);
  const [selectedModel, setSelectedModel] = useState("Nano Banana");
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const modelSheetRef = useRef<BottomSheetModal>(null);
  const translateY = useSharedValue(0);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        const keyboardHeight = e.endCoordinates.height;
        translateY.value = withTiming(-(keyboardHeight - insets.bottom - 52), {
          duration: 280,
          easing: Easing.out(Easing.cubic),
        });
      }
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        translateY.value = withTiming(0, {
          duration: 280,
          easing: Easing.out(Easing.cubic),
        });
      }
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [insets.bottom]);

  const promptBarStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const advancedOptionsProgress = useSharedValue(0);

  const toggleAdvancedOptions = useCallback(() => {
    const newValue = !showAdvancedOptions;
    advancedOptionsProgress.value = withTiming(newValue ? 1 : 0, {
      duration: 300,
      easing: Easing.out(Easing.cubic),
    });
    setShowAdvancedOptions(newValue);
  }, [showAdvancedOptions]);

  const advancedOptionsStyle = useAnimatedStyle(() => ({
    opacity: advancedOptionsProgress.value,
    height: advancedOptionsProgress.value * 36,
    overflow: 'hidden' as const,
  }));

  const actionButtonsStyle = useAnimatedStyle(() => ({
    marginTop: advancedOptionsProgress.value * 8,
  }));

  const aspectRatios = ["4:3", "3:2", "16:9", "3:4", "1:1", "4:5", "2:3", "9:16"];

  const getAspectRatioIcon = (ratio: string) => {
    switch (ratio) {
      case "16:9":
        return "rectangle.ratio.16.to.9";
      case "3:4":
        return "rectangle.portrait";
      case "9:16":
        return "rectangle.ratio.9.to.16";
      case "1:1":
        return "square";
      case "4:3":
        return "rectangle.ratio.4.to.3";
      case "3:2":
        return "rectangle";
      case "4:5":
        return "rectangle.portrait";
      case "2:3":
        return "rectangle.portrait";
      default:
        return "rectangle";
    }
  };

  const aspectRatioActions = aspectRatios.map((ratio) => ({
    id: ratio,
    title: ratio,
    image: getAspectRatioIcon(ratio),
    imageColor: "#ffffff",
  }));

  const handleAspectRatioAction = (event: { nativeEvent: { event: string } }) => {
    const ratio = event.nativeEvent.event;
    setSelectedAspectRatio(ratio);
  };

  const handleImageSourceAction = async (event: { nativeEvent: { event: string } }) => {
    const action = event.nativeEvent.event;
    if (action === "gallery") {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });
      if (!result.canceled) {
        console.log("Selected image from gallery:", result.assets[0].uri);
      }
    } else if (action === "assets") {
      console.log("Open assets");
    }
  };

  const imageSourceActions = [
    { id: "gallery", title: "Phone Gallery", image: "photo.on.rectangle", imageColor: "#ffffff" },
    { id: "assets", title: "Assets", image: "folder", imageColor: "#ffffff" },
  ];

  const imageCountActions = [1, 2, 3, 4].map((count) => ({
    id: count.toString(),
    title: `${count} ${count === 1 ? "Image" : "Images"}`,
    image: "photo",
    imageColor: "#ffffff",
  }));

  const handleImageCountAction = (event: { nativeEvent: { event: string } }) => {
    const count = parseInt(event.nativeEvent.event, 10);
    setNumberOfImages(count);
  };

  return (
    <View className="flex-1 bg-black">
      <SafeAreaView className="flex-1" edges={["top"]}>
        {/* Header */}
        <View className="px-5 py-2 flex-row items-center justify-between">
          <Pressable className="active:opacity-70">
            <Ionicons name="menu" size={28} color="#fff" />
          </Pressable>
          <View className="flex-row items-center">
            <View className="flex-row items-center mr-3">
              <Text className="text-white text-base font-semibold">5</Text>
              <Ionicons name="flash" size={18} color="#facc15" style={{ marginLeft: 2 }} />
            </View>
            <Pressable className="active:opacity-70">
              <LinearGradient
                colors={["#60a5fa", "#c4b5fd", "#fcd34d"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ width: 36, height: 36, borderRadius: 18 }}
              />
            </Pressable>
          </View>
        </View>

        {/* Main Content - Scrollable */}
        <ScrollView 
          className="flex-1" 
          contentContainerStyle={{ alignItems: 'center', paddingTop: 100 }}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          <Image 
            source={require("../../assets/imgnewgrad.png")} 
            style={{ width: 52, height: 52, borderRadius: 12, marginBottom: 8 }}
            resizeMode="cover"
          />
          <Text className="text-white text-sm font-medium">Image</Text>
        </ScrollView>

        {/* Prompt Bar at Bottom */}
        <Animated.View className="px-5" style={[{ paddingBottom: insets.bottom + 60 }, promptBarStyle]}>
          <View className="rounded-3xl pt-5 pb-2 px-3" style={{ backgroundColor: "#1e1e1e" }}>
            <TextInput
              value={prompt}
              onChangeText={setPrompt}
              placeholder="Describe the image you want to create"
              placeholderTextColor="#6b7280"
              className="text-white text-base mb-5 min-h-[32px] px-2"
              multiline
              returnKeyType="default"
            />

            {/* Options Row */}
            <View className="flex-row items-center">
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1" contentContainerStyle={{ paddingRight: 8 }} keyboardShouldPersistTaps="handled">
                <Pressable
                  onPress={() => {
                    Keyboard.dismiss();
                    modelSheetRef.current?.present();
                  }}
                  className="flex-row items-center rounded-full px-2.5 mr-2 active:opacity-70"
                  style={{ backgroundColor: "#2a2a2a", height: 28 }}
                >
                  <Text className="text-white text-xs mr-1">{selectedModel}</Text>
                  <Ionicons name="chevron-down" size={12} color="#fff" />
                </Pressable>
                <MenuView
                  title="Select Aspect Ratio"
                  onPressAction={handleAspectRatioAction}
                  actions={aspectRatioActions}
                >
                  <Pressable
                    className="flex-row items-center rounded-full px-2.5 mr-2 active:opacity-70"
                    style={{ backgroundColor: "#2a2a2a", height: 28 }}
                  >
                    <View
                      style={{
                        width: 10,
                        height: 12,
                        borderWidth: 1.5,
                        borderColor: "#fff",
                        borderRadius: 2,
                        marginRight: 5,
                      }}
                    />
                    <Text className="text-white text-xs">{selectedAspectRatio}</Text>
                  </Pressable>
                </MenuView>
                <MenuView
                  title="Number of Images"
                  onPressAction={handleImageCountAction}
                  actions={imageCountActions}
                >
                  <Pressable
                    className="flex-row items-center rounded-full px-2.5 mr-2 active:opacity-70"
                    style={{ backgroundColor: "#2a2a2a", height: 28 }}
                  >
                    <Ionicons name="copy-outline" size={14} color="#fff" />
                    <Text className="text-white text-xs ml-1.5">{numberOfImages}x</Text>
                  </Pressable>
                </MenuView>
              </ScrollView>
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 8 }}>
                <MenuView
                  title="Select Image Source"
                  onPressAction={handleImageSourceAction}
                  actions={imageSourceActions}
                >
                  <Pressable className="rounded-full p-2 mr-2 active:opacity-70" style={{ backgroundColor: "#3a3a3a" }}>
                    <Ionicons name="add" size={20} color="#fff" />
                  </Pressable>
                </MenuView>
                <Pressable className="rounded-full p-2 active:opacity-70" style={{ backgroundColor: "#3a3a3a" }}>
                  <Ionicons name="sparkles-outline" size={18} color="#fff" />
                </Pressable>
              </View>
            </View>

            {/* Enhance Prompt Row */}
            <View className="flex-row items-center mt-2">
              <Pressable
                className="flex-row items-center rounded-full px-2.5 py-1.5 mr-2 active:opacity-70"
                style={{ backgroundColor: "#2a2a2a" }}
              >
                <Ionicons name="hardware-chip-outline" size={14} color="#fff" />
                <Text className="text-white text-xs ml-1.5">Enhance prompt</Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </SafeAreaView>

      {/* Model Selector Bottom Sheet */}
      <ModelSelectorSheet ref={modelSheetRef} onSelectModel={setSelectedModel} />
    </View>
  );
}

