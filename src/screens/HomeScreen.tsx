import React, { useState, useRef, useCallback } from "react";
import { View, Text, Pressable, ScrollView, TextInput, TouchableWithoutFeedback, Keyboard, Image, ActionSheetIOS, Platform, Modal, LayoutAnimation, UIManager } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import Animated, { useAnimatedScrollHandler, useSharedValue, useAnimatedStyle, interpolate, withTiming, Easing } from "react-native-reanimated";
import * as ImagePicker from "expo-image-picker";
import { MenuView } from "@react-native-menu/menu";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import ModelSelectorSheet from "../components/ModelSelectorSheet";
import VideoModelSelectorSheet from "../components/VideoModelSelectorSheet";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Enable LayoutAnimation on Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [prompt, setPrompt] = useState("");
  const [selectedAspectRatio, setSelectedAspectRatio] = useState("2:3");
  const [selectedMode, setSelectedMode] = useState<"Image" | "Video">("Image");
  const [imagePickerVisible, setImagePickerVisible] = useState(false);
  const [numberOfImages, setNumberOfImages] = useState(1);
  const [selectedModel, setSelectedModel] = useState("Nano Banana");
  const [selectedVideoModel, setSelectedVideoModel] = useState("Kandinsky 5");
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

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

  const scrollY = useSharedValue(0);
  const modelSheetRef = useRef<BottomSheetModal>(null);
  const videoModelSheetRef = useRef<BottomSheetModal>(null);

  const handleOpenModelSheet = useCallback(() => {
    if (selectedMode === "Image") {
      modelSheetRef.current?.present();
    } else {
      videoModelSheetRef.current?.present();
    }
  }, [selectedMode]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

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

  const getAspectRatioDimensions = (ratio: string): { width: number; height: number } => {
    switch (ratio) {
      case "1:1":
        return { width: 12, height: 12 };
      case "4:3":
        return { width: 14, height: 11 };
      case "3:2":
        return { width: 14, height: 10 };
      case "16:9":
        return { width: 16, height: 9 };
      case "3:4":
        return { width: 11, height: 14 };
      case "2:3":
        return { width: 10, height: 14 };
      case "4:5":
        return { width: 11, height: 13 };
      case "9:16":
        return { width: 8, height: 14 };
      default:
        return { width: 12, height: 12 };
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

  const handleMenuAction = (event: { nativeEvent: { event: string } }) => {
    const action = event.nativeEvent.event;
    if (action === "image") {
      setSelectedMode("Image");
    } else if (action === "video") {
      setSelectedMode("Video");
    }
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
        // Handle selected image
        console.log("Selected image from gallery:", result.assets[0].uri);
      }
    } else if (action === "assets") {
      // Navigate to assets screen or show assets picker
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

  const handleTakePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (permissionResult.granted === false) {
      alert("Camera permission is required!");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      // Handle the selected image
      console.log("Camera image:", result.assets[0].uri);
    }
  };

  const handleChooseFromLibrary = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      alert("Media library permission is required!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      // Handle the selected image
      console.log("Library image:", result.assets[0].uri);
    }
  };

  const tools = [
    { id: "all", icon: "apps", label: "All tools", gradient: ["#a855f7", "#6366f1", "#3b82f6"] },
    { id: "image", icon: "image", label: "Image", gradient: ["#06b6d4", "#3b82f6", "#6366f1"], customImage: require("../../assets/imgnewgrad.png") },
    { id: "video", icon: "videocam", label: "Video", gradient: ["#f59e0b", "#fb923c", "#f97316"], customImage: require("../../assets/vidnewgrad.png") },
    { id: "edit", icon: "color-wand", label: "Edit", gradient: ["#a855f7", "#d946ef", "#ec4899"] },
    { id: "enhance", icon: "sparkles", label: "Enhance", gradient: ["#6b7280", "#9ca3af", "#d1d5db"] },
  ];

  const styleCategories = [
    {
      title: "Liquid Metal",
      emoji: "💧",
      images: [
        "https://images.pexels.com/photos/1209843/pexels-photo-1209843.jpeg?auto=compress&cs=tinysrgb&w=400",
        "https://images.pexels.com/photos/1209844/pexels-photo-1209844.jpeg?auto=compress&cs=tinysrgb&w=400",
        "https://images.pexels.com/photos/1209845/pexels-photo-1209845.jpeg?auto=compress&cs=tinysrgb&w=400",
      ],
    },
    {
      title: "Red",
      emoji: "🔴",
      images: [
        "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=400",
        "https://images.pexels.com/photos/3861972/pexels-photo-3861972.jpeg?auto=compress&cs=tinysrgb&w=400",
        "https://images.pexels.com/photos/3861976/pexels-photo-3861976.jpeg?auto=compress&cs=tinysrgb&w=400",
      ],
    },
    {
      title: "Action Figure",
      emoji: "🎭",
      hasUpgrade: true,
      images: [
        "https://images.pexels.com/photos/163036/mario-luigi-yoschi-figures-163036.jpeg?auto=compress&cs=tinysrgb&w=400",
        "https://images.pexels.com/photos/1743165/pexels-photo-1743165.jpeg?auto=compress&cs=tinysrgb&w=400",
        "https://images.pexels.com/photos/3945683/pexels-photo-3945683.jpeg?auto=compress&cs=tinysrgb&w=400",
      ],
    },
    {
      title: "Muppet Style",
      emoji: "🧸",
      hasUpgrade: true,
      images: [
        "https://images.pexels.com/photos/3825880/pexels-photo-3825880.jpeg?auto=compress&cs=tinysrgb&w=400",
        "https://images.pexels.com/photos/4065876/pexels-photo-4065876.jpeg?auto=compress&cs=tinysrgb&w=400",
        "https://images.pexels.com/photos/4588047/pexels-photo-4588047.jpeg?auto=compress&cs=tinysrgb&w=400",
      ],
    },
    {
      title: "Cinematic",
      emoji: "🎬",
      images: [
        "https://images.pexels.com/photos/3062541/pexels-photo-3062541.jpeg?auto=compress&cs=tinysrgb&w=400",
        "https://images.pexels.com/photos/3363111/pexels-photo-3363111.jpeg?auto=compress&cs=tinysrgb&w=400",
        "https://images.pexels.com/photos/1144275/pexels-photo-1144275.jpeg?auto=compress&cs=tinysrgb&w=400",
      ],
    },
    {
      title: "Neon Dreams",
      emoji: "✨",
      images: [
        "https://images.pexels.com/photos/2144326/pexels-photo-2144326.jpeg?auto=compress&cs=tinysrgb&w=400",
        "https://images.pexels.com/photos/3975590/pexels-photo-3975590.jpeg?auto=compress&cs=tinysrgb&w=400",
        "https://images.pexels.com/photos/2764678/pexels-photo-2764678.jpeg?auto=compress&cs=tinysrgb&w=400",
      ],
    },
  ];

  // Animated style for blur opacity and gradient
  const headerAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, 50],
      [0, 1],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );

    return {
      opacity,
    };
  });

  return (
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
            </SafeAreaView>
          </BlurView>
        </Animated.View>

        {/* Static Header (always visible) */}
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 9 }}>
          <SafeAreaView edges={["top"]}>
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
          </SafeAreaView>
        </View>

        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <Animated.ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingTop: 120 }}
            onScroll={scrollHandler}
            scrollEventThrottle={16}
          >

            {/* Main Content */}
            <View className="px-5">
              {/* Main Heading */}
              <Text className="text-white text-xl font-bold mb-8 text-center">
                What do you want to create today?
              </Text>

              {/* Prompt Input Box */}
              <View className="rounded-3xl pt-5 pb-2 px-3 mb-4" style={{ backgroundColor: "#1e1e1e" }}>
                <TextInput
                  value={prompt}
                  onChangeText={setPrompt}
                  placeholder="Describe what you want to create"
                  placeholderTextColor="#6b7280"
                  className="text-white text-base mb-5 min-h-[32px] px-2"
                  multiline
                  returnKeyType="default"
                />

                {/* Options Row */}
                <View className="flex-row items-center">
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1" contentContainerStyle={{ paddingRight: 8 }}>
                    <MenuView
                      onPressAction={handleMenuAction}
                      actions={[
                        {
                          id: "image",
                          title: "Image",
                          image: "photo",
                          imageColor: "#ffffff",
                        },
                        {
                          id: "video",
                          title: "Video",
                          image: "video",
                          imageColor: "#ffffff",
                        },
                      ]}
                    >
                      <Pressable
                        className="flex-row items-center rounded-full px-2.5 mr-2 active:opacity-70"
                        style={{ backgroundColor: "#2a2a2a", height: 28 }}
                      >
                        <Ionicons name={selectedMode === "Image" ? "image-outline" : "videocam-outline"} size={14} color="#fff" />
                        <Text className="text-white text-xs ml-1.5">{selectedMode}</Text>
                      </Pressable>
                    </MenuView>
                    <Pressable
                      onPress={handleOpenModelSheet}
                      className="flex-row items-center rounded-full px-2.5 mr-2 active:opacity-70"
                      style={{ backgroundColor: "#2a2a2a", height: 28 }}
                    >
                      <Text className="text-white text-xs mr-1">{selectedMode === "Image" ? selectedModel : selectedVideoModel}</Text>
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
                    <Pressable 
                      onPress={toggleAdvancedOptions}
                      className="rounded-full p-1.5 mr-2 active:opacity-70" 
                      style={{ backgroundColor: showAdvancedOptions ? "#fff" : "#2d2d2d" }}
                    >
                      <Ionicons name="options-outline" size={16} color={showAdvancedOptions ? "#000" : "#fff"} />
                    </Pressable>
                  </ScrollView>
                  <Animated.View style={[{ flexDirection: 'row', alignItems: 'center', paddingLeft: 8 }, actionButtonsStyle]}>
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
                  </Animated.View>
                </View>

                {/* Advanced Options Row */}
                <Animated.View style={[{ flexDirection: 'row', alignItems: 'center' }, advancedOptionsStyle]}>
                  {selectedMode === "Image" && (
                    <MenuView
                      title="Number of Images"
                      onPressAction={handleImageCountAction}
                      actions={imageCountActions}
                    >
                      <Pressable
                        className="flex-row items-center rounded-full px-2.5 py-1.5 mr-2 active:opacity-70"
                        style={{ backgroundColor: "#2a2a2a" }}
                      >
                        <Ionicons name="copy-outline" size={14} color="#fff" />
                        <Text className="text-white text-xs ml-1.5">{numberOfImages}x</Text>
                      </Pressable>
                    </MenuView>
                  )}
                  <Pressable
                    className="flex-row items-center rounded-full px-2.5 py-1.5 mr-2 active:opacity-70"
                    style={{ backgroundColor: "#2a2a2a" }}
                  >
                    <Ionicons name="hardware-chip-outline" size={14} color="#fff" />
                    <Text className="text-white text-xs ml-1.5">Enhance prompt</Text>
                  </Pressable>
                </Animated.View>
              </View>

              {/* Tool Categories */}
              <View className="flex-row justify-between mb-6 mt-2">
                {tools.map((tool) => (
                  <Pressable
                    key={tool.id}
                    className="items-center active:opacity-70"
                    style={{ width: 60 }}
                  >
                    {tool.customImage ? (
                      <Image
                        source={tool.customImage}
                        style={{ width: 52, height: 52, borderRadius: 16, marginBottom: 6 }}
                        resizeMode="cover"
                      />
                    ) : (
                      <LinearGradient
                        colors={tool.gradient as any}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{ width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center", marginBottom: 6 }}
                      >
                        <Ionicons name={tool.icon as any} size={24} color="#fff" />
                      </LinearGradient>
                    )}
                    <Text className="text-white text-xs text-center">{tool.label}</Text>
                  </Pressable>
                ))}
              </View>

              {/* Style Categories */}
              {styleCategories.map((category, catIndex) => (
                <View key={catIndex} className="mb-8">
                  <View className="flex-row items-center justify-between mb-4">
                    <View className="flex-row items-center">
                      <Text className="text-2xl mr-2">{category.emoji}</Text>
                      <Text className="text-white text-2xl font-bold">
                        {category.title}
                      </Text>
                    </View>
                    {category.hasUpgrade && (
                      <View className="bg-yellow-400 rounded-full px-3 py-1 flex-row items-center">
                        <Ionicons name="star" size={12} color="#000" />
                        <Text className="text-black text-xs font-semibold ml-1">Upgrade</Text>
                      </View>
                    )}
                  </View>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {category.images.map((imageUrl, imgIndex) => (
                      <Pressable key={imgIndex} className="mr-3 active:opacity-70">
                        <View
                          className="w-40 h-52 rounded-3xl overflow-hidden"
                          style={{ backgroundColor: "#1e293b" }}
                        >
                          <Image
                            source={{ uri: imageUrl }}
                            className="w-full h-full"
                            resizeMode="cover"
                          />
                        </View>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              ))}
            </View>
          </Animated.ScrollView>
        </TouchableWithoutFeedback>
      </SafeAreaView>

      {/* Image Picker Modal */}
      <Modal
        visible={imagePickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setImagePickerVisible(false)}
      >
        <Pressable
          className="flex-1 justify-end"
          style={{ backgroundColor: "rgba(0,0,0,0.8)" }}
          onPress={() => setImagePickerVisible(false)}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{ backgroundColor: "#1e1e1e" }}
            className="rounded-t-3xl"
          >
            <SafeAreaView edges={["bottom"]}>
              <View className="px-5 py-6">
                {/* Take Photo Option */}
                <Pressable
                  onPress={handleTakePhoto}
                  className="flex-row items-center rounded-2xl p-4 mb-3 active:opacity-70"
                  style={{ backgroundColor: "#2a2a2a" }}
                >
                  <View
                    className="w-12 h-12 rounded-full items-center justify-center mr-4"
                    style={{ backgroundColor: "#3a3a3a" }}
                  >
                    <Ionicons name="camera" size={24} color="#fff" />
                  </View>
                  <Text className="text-white text-base font-semibold">Take Photo</Text>
                </Pressable>

                {/* Choose from Library Option */}
                <Pressable
                  onPress={handleChooseFromLibrary}
                  className="flex-row items-center rounded-2xl p-4 active:opacity-70"
                  style={{ backgroundColor: "#2a2a2a" }}
                >
                  <View
                    className="w-12 h-12 rounded-full items-center justify-center mr-4"
                    style={{ backgroundColor: "#3a3a3a" }}
                  >
                    <Ionicons name="image" size={24} color="#fff" />
                  </View>
                  <Text className="text-white text-base font-semibold">Choose from Library</Text>
                </Pressable>
              </View>
            </SafeAreaView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Model Selector Bottom Sheet */}
      <ModelSelectorSheet ref={modelSheetRef} onSelectModel={setSelectedModel} />
      <VideoModelSelectorSheet ref={videoModelSheetRef} onSelectModel={setSelectedVideoModel} />
    </View>
  );
}
