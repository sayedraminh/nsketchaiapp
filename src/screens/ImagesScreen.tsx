import React, { useState, useRef, useCallback, useEffect } from "react";
import { View, Text, Pressable, ScrollView, TextInput, Platform, UIManager, Image, Keyboard, Dimensions, ActivityIndicator, Alert, ToastAndroid } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { MenuView } from "@react-native-menu/menu";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, useAnimatedScrollHandler, interpolate } from "react-native-reanimated";
import * as ImagePicker from "expo-image-picker";
import * as Clipboard from "expo-clipboard";
import ModelSelectorSheet from "../components/ModelSelectorSheet";
import GeneratedImageSheet from "../components/GeneratedImageSheet";
import SessionsDrawer, { SessionsDrawerRef } from "../components/SessionsDrawer";
import { useRoute, RouteProp, useFocusEffect } from "@react-navigation/native";
import { Animated as RNAnimated } from "react-native";
import { TabParamList } from "../navigation/TabNavigator";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useCredits } from "../hooks/useCredits";
import { useUser } from "@clerk/clerk-expo";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const IMAGE_WIDTH = SCREEN_WIDTH - 40;
const MULTI_IMAGE_WIDTH = SCREEN_WIDTH * 0.7;

// Enable LayoutAnimation on Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type ImagesScreenRouteProp = RouteProp<TabParamList, "Images">;

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  const formattedHours = hours % 12 || 12;
  const formattedMinutes = minutes.toString().padStart(2, "0");
  return `${formattedHours}:${formattedMinutes}${ampm}`;
}

export default function ImagesScreen() {
  const route = useRoute<ImagesScreenRouteProp>();
  const { user } = useUser();
  const { credits, isLoading: creditsLoading } = useCredits();
  const insets = useSafeAreaInsets();
  
  // Track current session - use local state so we can clear it
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(undefined);
  const [currentSessionTitle, setCurrentSessionTitle] = useState<string | undefined>(undefined);
  
  const [prompt, setPrompt] = useState("");
  const [selectedAspectRatio, setSelectedAspectRatio] = useState("2:3");
  const [numberOfImages, setNumberOfImages] = useState(1);
  const [selectedModel, setSelectedModel] = useState("Nano Banana");
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const drawerRef = useRef<SessionsDrawerRef>(null);
  const modelSheetRef = useRef<BottomSheetModal>(null);
  const imageDetailSheetRef = useRef<BottomSheetModal>(null);
  const [selectedImage, setSelectedImage] = useState<{
    url: string;
    prompt?: string;
    model?: string;
    aspectRatio?: string;
    createdAt?: number;
  } | null>(null);
  const translateY = useSharedValue(0);
  const scrollY = useSharedValue(0);

  // Update session when route params change
  useEffect(() => {
    if (route.params?.sessionId) {
      setCurrentSessionId(route.params.sessionId);
      setCurrentSessionTitle(route.params.sessionTitle);
    }
  }, [route.params?.sessionId, route.params?.sessionTitle]);

  // Fetch generations if we have a sessionId
  const generations = useQuery(
    api.sessions.getSessionGenerations,
    currentSessionId ? { sessionId: currentSessionId as Id<"sessions"> } : "skip"
  );
  const isLoadingGenerations = currentSessionId && generations === undefined;

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
    <SessionsDrawer ref={drawerRef} currentScreen="image">
      <View className="flex-1 bg-black">
      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
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


        {/* Main Content - Scrollable */}
        <Animated.ScrollView 
          className="flex-1" 
          contentContainerStyle={(!currentSessionId || !generations || generations.length === 0) ? { alignItems: 'center', justifyContent: 'center', flexGrow: 1, paddingBottom: 280 } : { paddingHorizontal: 20, paddingTop: 70, paddingBottom: 280 }}
          showsVerticalScrollIndicator={false}
          bounces={true}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
        >
          {isLoadingGenerations ? (
            <View className="items-center justify-center py-20">
              <ActivityIndicator size="large" color="#a855f7" />
              <Text className="text-gray-500 text-sm mt-3">Loading...</Text>
            </View>
          ) : !currentSessionId || !generations || generations.length === 0 ? (
            <>
              <Image 
                source={require("../../assets/imgnewgrad.png")} 
                style={{ width: 52, height: 52, borderRadius: 12, marginBottom: 8 }}
                resizeMode="cover"
              />
              <Text className="text-white text-sm font-medium">Image</Text>
            </>
          ) : (
            generations.map((gen: any, index: number) => {
              const images = gen.images || [];
              const hasMultipleImages = images.length > 1;
              
              return (
                <View key={gen._id} className={index < generations.length - 1 ? "mb-6" : ""}>
                  {/* Prompt Text at TOP */}
                  {gen.prompt && (
                    <View className="bg-neutral-800 rounded-3xl px-4 py-3 mb-2 self-end" style={{ maxWidth: '90%' }}>
                      <Text className="text-white text-base text-center" numberOfLines={7}>
                        {gen.prompt}
                      </Text>
                    </View>
                  )}

                  {/* Model Badge and Time - Right aligned */}
                  <View className="flex-row items-center justify-end mb-2">
                    <View className="flex-row items-center bg-neutral-800 rounded-full px-3 py-1.5 mr-2">
                      <Ionicons name="image-outline" size={14} color="#fff" />
                      <Text className="text-white text-xs ml-1.5">{selectedModel}</Text>
                    </View>
                    <Text className="text-gray-500 text-xs">
                      {formatTime(gen.completedAt || gen.createdAt)}
                    </Text>
                  </View>

                  {/* Generation Header */}
                  <View className="flex-row items-center mb-3">
                    <View className="w-8 h-8 rounded-lg bg-purple-600 items-center justify-center mr-2">
                      <Ionicons name="sparkles" size={16} color="#fff" />
                    </View>
                    <Text className="text-gray-400 text-sm">
                      Generated at {formatTime(gen.completedAt || gen.createdAt)}
                    </Text>
                  </View>

                  {/* Images */}
                  {images.length === 0 ? (
                    <View
                      className="rounded-2xl items-center justify-center"
                      style={{ width: IMAGE_WIDTH, height: IMAGE_WIDTH * 0.75, backgroundColor: "#1a1a1a" }}
                    >
                      <Ionicons name="image-outline" size={48} color="#4b5563" />
                    </View>
                  ) : images.length === 1 ? (
                    <Pressable 
                      onPress={() => {
                        setSelectedImage({
                          url: images[0].url,
                          prompt: gen.prompt,
                          model: selectedModel,
                          aspectRatio: selectedAspectRatio,
                          createdAt: gen.completedAt || gen.createdAt,
                        });
                        imageDetailSheetRef.current?.present();
                      }}
                      className="rounded-2xl overflow-hidden active:opacity-90" 
                      style={{ width: IMAGE_WIDTH }}
                    >
                      <Image
                        source={{ uri: images[0].url }}
                        style={{ width: IMAGE_WIDTH, height: IMAGE_WIDTH * 1.2 }}
                        resizeMode="cover"
                      />
                    </Pressable>
                  ) : (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      snapToInterval={MULTI_IMAGE_WIDTH + 12}
                      decelerationRate="fast"
                      style={{ marginHorizontal: -20 }}
                      contentContainerStyle={{ paddingHorizontal: 20 }}
                    >
                      {images.map((img: any, imgIndex: number) => (
                        <Pressable
                          key={imgIndex}
                          onPress={() => {
                            setSelectedImage({
                              url: img.url,
                              prompt: gen.prompt,
                              model: selectedModel,
                              aspectRatio: selectedAspectRatio,
                              createdAt: gen.completedAt || gen.createdAt,
                            });
                            imageDetailSheetRef.current?.present();
                          }}
                          className="rounded-2xl overflow-hidden mr-3 active:opacity-90"
                          style={{ width: MULTI_IMAGE_WIDTH }}
                        >
                          <Image
                            source={{ uri: img.url }}
                            style={{ width: MULTI_IMAGE_WIDTH, height: MULTI_IMAGE_WIDTH * 1.3 }}
                            resizeMode="cover"
                          />
                        </Pressable>
                      ))}
                    </ScrollView>
                  )}

                  {/* Action Buttons */}
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="mt-3"
                    contentContainerStyle={{ gap: 16 }}
                  >
                    <Pressable className="flex-row items-center active:opacity-70">
                      <Ionicons name="refresh-outline" size={16} color="#9ca3af" />
                      <Text className="text-gray-400 text-sm ml-1">Retry</Text>
                    </Pressable>
                    <Pressable 
                      className="flex-row items-center active:opacity-70"
                      onPress={async () => {
                        await Clipboard.setStringAsync(gen.prompt || '');
                        if (Platform.OS === 'ios') {
                          Alert.alert('Copied', 'Prompt copied to clipboard');
                        } else {
                          ToastAndroid.show('Copied to clipboard', ToastAndroid.SHORT);
                        }
                      }}
                    >
                      <Ionicons name="copy-outline" size={16} color="#9ca3af" />
                      <Text className="text-gray-400 text-sm ml-1">Copy</Text>
                    </Pressable>
                    <Pressable className="flex-row items-center active:opacity-70">
                      <Ionicons name="share-outline" size={16} color="#9ca3af" />
                      <Text className="text-gray-400 text-sm ml-1">Share Parameters</Text>
                    </Pressable>
                    <Pressable className="flex-row items-center active:opacity-70">
                      <Ionicons name="download-outline" size={16} color="#9ca3af" />
                      <Text className="text-gray-400 text-sm ml-1">Download</Text>
                    </Pressable>
                  </ScrollView>
                </View>
              );
            })
          )}
        </Animated.ScrollView>

        {/* Prompt Bar at Bottom */}
        <Animated.View style={[{ position: 'absolute', bottom: 90, left: 12, right: 12 }, promptBarStyle]}>
          <BlurView 
            intensity={80} 
            tint="dark"
            style={{ 
              borderRadius: 24,
              overflow: 'hidden',
            }}
          >
            <View className="pt-5 pb-3 px-4" style={{ backgroundColor: 'rgba(30, 30, 30, 0.7)' }}>
              <TextInput
                value={prompt}
                onChangeText={setPrompt}
                placeholder="Describe the image you want to create"
                placeholderTextColor="#9ca3af"
                className="text-white text-base mb-5 min-h-[32px] px-2"
                style={{ maxHeight: 100 }}
                multiline
                maxLength={4000}
                numberOfLines={6}
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
                  style={{ backgroundColor: "#3a3a3a", height: 28 }}
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
                    style={{ backgroundColor: "#3a3a3a", height: 28 }}
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
                    style={{ backgroundColor: "#3a3a3a", height: 28 }}
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
                style={{ backgroundColor: "#3a3a3a" }}
              >
                <Ionicons name="hardware-chip-outline" size={14} color="#fff" />
                <Text className="text-white text-xs ml-1.5">Enhance prompt</Text>
              </Pressable>
            </View>
          </View>
          </BlurView>
        </Animated.View>
      </SafeAreaView>

      {/* Model Selector Bottom Sheet */}
      <ModelSelectorSheet ref={modelSheetRef} onSelectModel={setSelectedModel} />

      {/* Generated Image Detail Sheet */}
      <GeneratedImageSheet
        ref={imageDetailSheetRef}
        image={selectedImage}
        onClose={() => setSelectedImage(null)}
      />
      </View>
    </SessionsDrawer>
  );
}

