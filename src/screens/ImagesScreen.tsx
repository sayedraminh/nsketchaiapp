import React, { useState, useRef, useCallback, useEffect } from "react";
import { View, Text, Pressable, ScrollView, TextInput, Platform, UIManager, Keyboard, Dimensions, ActivityIndicator, Alert, ToastAndroid, Linking } from "react-native";
import { Image } from "expo-image";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import { BlurView } from "expo-blur";
import { MenuView } from "@react-native-menu/menu";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withRepeat, Easing, useAnimatedScrollHandler, interpolate, FadeIn } from "react-native-reanimated";
import * as Clipboard from "expo-clipboard";
import ModelSelectorSheet from "../components/ModelSelectorSheet";
import GeneratedImageSheet from "../components/GeneratedImageSheet";
import SessionsDrawer, { SessionsDrawerRef } from "../components/SessionsDrawer";
import { useRoute, RouteProp } from "@react-navigation/native";
import { TabParamList } from "../navigation/TabNavigator";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useCredits } from "../hooks/useCredits";
import { useUser, useAuth } from "@clerk/clerk-expo";
import { useImageGeneration } from "../hooks/useImageGeneration";
import {
  ImageModelId,
  AspectRatio,
  Resolution,
  Quality,
  getModelById,
  getModelAspectRatios,
  modelRequiresAttachment,
  modelSupportsResolution,
  modelSupportsQuality,
  modelSupportsMultipleImages,
  isKlingO1Model,
  validateKlingO1Prompt,
  calculateImageCost,
  isAttachmentDisabled,
  isAspectRatioDisabled,
  getResolutionOptions,
  getMaxImages,
  getEffectiveModelId,
  isUnifiedModel,
  DEFAULT_SETTINGS,
} from "../config/imageModels";
import { pickImages, uploadAttachments, SelectedImage } from "../lib/attachments";
import AssetPickerSheet from "../components/AssetPickerSheet";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import { AutoSkeletonView } from "react-native-auto-skeleton";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const IMAGE_WIDTH = SCREEN_WIDTH - 80; // Smaller width for better fit
const MULTI_IMAGE_WIDTH = SCREEN_WIDTH * 0.55;

// Enable LayoutAnimation on Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type ImagesScreenRouteProp = RouteProp<TabParamList, "Images">;

// Spinning icon component for loading state
function SpinningIcon() {
  const rotation = useSharedValue(0);
  
  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 1000, easing: Easing.linear }),
      -1, // infinite
      false
    );
  }, []);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));
  
  return (
    <Animated.View style={animatedStyle}>
      <Ionicons name="sync" size={24} color="#a855f7" />
    </Animated.View>
  );
}

// Shimmer text component - wave effect sweeping left to right
function ShimmerText({ text }: { text: string }) {
  const translateX = useSharedValue(-100);
  
  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(100, { duration: 1500, easing: Easing.linear }),
      -1,
      false
    );
  }, []);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));
  
  return (
    <MaskedView
      style={{ marginLeft: 8 }}
      maskElement={
        <Text style={{ fontSize: 14, fontWeight: '400' }}>{text}</Text>
      }
    >
      <Text style={{ fontSize: 14, color: '#6b7280' }}>{text}</Text>
      <Animated.View 
        style={[
          { 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0,
          },
          animatedStyle
        ]}
      >
        <LinearGradient
          colors={['transparent', '#ffffff', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1, width: 80 }}
        />
      </Animated.View>
    </MaskedView>
  );
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  const formattedHours = hours % 12 || 12;
  const formattedMinutes = minutes.toString().padStart(2, "0");
  return `${formattedHours}:${formattedMinutes}${ampm}`;
}

// Parse aspect ratio string (e.g., "2:3") to numeric value (width/height)
function parseAspectRatio(ratio?: string): number {
  if (!ratio) return 1;
  const parts = ratio.split(":");
  if (parts.length !== 2) return 1;
  const w = parseFloat(parts[0]);
  const h = parseFloat(parts[1]);
  if (isNaN(w) || isNaN(h) || h === 0) return 1;
  return w / h;
}

export default function ImagesScreen() {
  const route = useRoute<ImagesScreenRouteProp>();
  const { user } = useUser();
  const { getToken } = useAuth();
  const { credits, isLoading: creditsLoading } = useCredits();
  const insets = useSafeAreaInsets();
  
  // Image generation hook
  const {
    status: generationStatus,
    error: generationError,
    progress: generationProgress,
    isGenerating,
    settings,
    updateSettings,
    generate,
    cancel: cancelGeneration,
    reset: resetGeneration,
  } = useImageGeneration();
  
  // Track current session - use local state so we can clear it
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(undefined);
  const [currentSessionTitle, setCurrentSessionTitle] = useState<string | undefined>(undefined);
  
  // Generation input state
  const [prompt, setPrompt] = useState("");
  const [selectedModelId, setSelectedModelId] = useState<ImageModelId>(DEFAULT_SETTINGS.modelId);
  const [selectedModelLabel, setSelectedModelLabel] = useState("Nano Banana");
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<AspectRatio>(DEFAULT_SETTINGS.aspectRatio);
  const [numberOfImages, setNumberOfImages] = useState(DEFAULT_SETTINGS.numImages);
  const [selectedResolution, setSelectedResolution] = useState<Resolution>(DEFAULT_SETTINGS.resolution);
  const [selectedQuality, setSelectedQuality] = useState<Quality>(DEFAULT_SETTINGS.quality);
  const [attachments, setAttachments] = useState<SelectedImage[]>([]);
  const [isUploadingAttachments, setIsUploadingAttachments] = useState(false);
  const [savingGenerationId, setSavingGenerationId] = useState<string | null>(null);

  const [pendingGenerationPreview, setPendingGenerationPreview] = useState<{
    prompt: string;
    modelLabel: string;
    aspectRatio: AspectRatio;
    numImages: number;
  } | null>(null);
  
  // UI state
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const drawerRef = useRef<SessionsDrawerRef>(null);
  const modelSheetRef = useRef<BottomSheetModal>(null);
  const imageDetailSheetRef = useRef<BottomSheetModal>(null);
  const assetPickerSheetRef = useRef<BottomSheetModal>(null);
  const [selectedImage, setSelectedImage] = useState<{
    url: string;
    prompt?: string;
    model?: string;
    aspectRatio?: string;
    createdAt?: number;
  } | null>(null);
  const translateY = useSharedValue(0);
  const scrollY = useSharedValue(0);
  const attachmentsProgress = useSharedValue(0);

  const attachmentsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: attachmentsProgress.value,
    height: attachmentsProgress.value * 76,
    overflow: 'hidden' as const,
  }));

  // Animate attachments section when attachments change
  useEffect(() => {
    attachmentsProgress.value = withTiming(attachments.length > 0 ? 1 : 0, {
      duration: 250,
      easing: Easing.out(Easing.cubic),
    });
  }, [attachments.length]);
  
  // Track if we've processed incoming data from Home screen
  const processedIncomingRef = useRef<string | null>(null);
  
  // Get current model metadata
  const currentModel = getModelById(selectedModelId);
  const requiresAttachment = modelRequiresAttachment(selectedModelId);
  const supportsResolution = modelSupportsResolution(selectedModelId);
  const supportsQuality = modelSupportsQuality(selectedModelId);
  const allowedAspectRatios = getModelAspectRatios(selectedModelId);
  const estimatedCost = calculateImageCost(selectedModelId, numberOfImages, {
    resolution: selectedResolution,
    quality: selectedQuality,
    aspectRatio: selectedAspectRatio,
  });

  // Update session when route params change
  useEffect(() => {
    if (route.params?.sessionId) {
      setCurrentSessionId(route.params.sessionId);
      setCurrentSessionTitle(route.params.sessionTitle);
    }
  }, [route.params?.sessionId, route.params?.sessionTitle]);

  // Handle generation from incoming Home screen data
  const handleGenerateFromIncoming = async (incoming: {
    prompt: string;
    modelId: string;
    modelLabel: string;
    aspectRatio: string;
    numImages: number;
    imageUrls?: string[];
  }) => {
    try {
      const token = await getToken();
      if (!token) {
        Alert.alert("Error", "Authentication required");
        return;
      }

      // Prepare attachment URLs if any
      let attachmentUrls: Array<{ url: string }> | undefined;
      if (incoming.imageUrls && incoming.imageUrls.length > 0) {
        attachmentUrls = incoming.imageUrls.map(url => ({ url }));
      }

      // Get effective model ID (switches to edit model if attachments present)
      const effectiveModelId = getEffectiveModelId(
        incoming.modelId as ImageModelId, 
        (attachmentUrls?.length ?? 0) > 0
      );

      // Start generation
      const result = await generate({
        prompt: incoming.prompt,
        modelId: effectiveModelId,
        aspectRatio: incoming.aspectRatio as AspectRatio,
        numImages: incoming.numImages,
        attachmentImages: attachmentUrls,
        sessionId: undefined, // Fresh session
        onSessionId: (sessionId) => {
          setCurrentSessionId((prev) => prev ?? sessionId);
        },
      });

      if (result.success) {
        // Update session if new one was created
        if (result.sessionId) {
          setCurrentSessionId(result.sessionId);
        }
      } else {
        Alert.alert("Generation Failed", result.error || "Unknown error");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Generation failed";
      Alert.alert("Error", message);
    }
  };

  // Handle incoming generation data from Home screen
  useEffect(() => {
    const incoming = route.params?.incoming;
    if (!incoming) return;

    // Create a unique key for this incoming request to prevent duplicate processing
    const incomingKey = `${incoming.prompt}-${incoming.modelId}-${Date.now()}`;
    if (processedIncomingRef.current === incomingKey) return;
    
    // Prefill the prompt bar with incoming data
    setPrompt(incoming.prompt);
    if (incoming.modelId) {
      setSelectedModelId(incoming.modelId as ImageModelId);
    }
    if (incoming.modelLabel) {
      setSelectedModelLabel(incoming.modelLabel);
    }
    if (incoming.aspectRatio) {
      setSelectedAspectRatio(incoming.aspectRatio as AspectRatio);
    }
    if (incoming.numImages) {
      setNumberOfImages(incoming.numImages);
    }

    // Handle attached images from Home
    if (incoming.imageUrls && incoming.imageUrls.length > 0) {
      const newAttachments: SelectedImage[] = incoming.imageUrls.map(url => ({
        uri: url,
        url: url,
        width: 0,
        height: 0,
        isFromAssets: true,
      } as SelectedImage & { url?: string; isFromAssets?: boolean }));
      setAttachments(newAttachments);
    }

    // Mark as processed
    processedIncomingRef.current = incomingKey;

    // Clear the session for a fresh generation
    setCurrentSessionId(undefined);
    setCurrentSessionTitle(undefined);

    // Auto-trigger generation if requested
    if (incoming.autoGenerate) {
      // Small delay to ensure state is updated
      setTimeout(() => {
        handleGenerateFromIncoming(incoming);
      }, 100);
    }
  }, [route.params?.incoming]);

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
      case "21:9":
        return "rectangle";
      case "5:4":
        return "rectangle";
      default:
        return "rectangle";
    }
  };

  // Use model-specific aspect ratios
  const modelAspectRatios = getModelAspectRatios(selectedModelId);
  const aspectRatioActions = modelAspectRatios.map((ratio) => ({
    id: ratio,
    title: ratio,
    image: getAspectRatioIcon(ratio),
    imageColor: "#ffffff",
  }));

  const handleAspectRatioAction = (event: { nativeEvent: { event: string } }) => {
    const ratio = event.nativeEvent.event as AspectRatio;
    if (allowedAspectRatios.includes(ratio)) {
      setSelectedAspectRatio(ratio);
    }
  };

  // Check if model supports multiple images
  const supportsMultipleImages = modelSupportsMultipleImages(selectedModelId);
  const isKlingO1 = isKlingO1Model(selectedModelId);

  // Handle image source menu action (native MenuView)
  const handleImageSourceMenuAction = async (event: { nativeEvent: { event: string } }) => {
    const action = event.nativeEvent.event;
    if (action === "gallery") {
      handleSelectFromGallery();
    } else if (action === "assets") {
      Keyboard.dismiss();
      assetPickerSheetRef.current?.present();
    }
  };

  // Handle gallery selection
  const handleSelectFromGallery = async () => {
    try {
      const model = getModelById(selectedModelId);
      const maxSelection = model?.maxAttachments ?? 10;
      const allowMultiple = supportsMultipleImages;
      const currentCount = attachments.length;
      const remainingSlots = maxSelection - currentCount;

      if (remainingSlots <= 0 && supportsMultipleImages) {
        Alert.alert("Maximum Images", `You can only attach up to ${maxSelection} images`);
        return;
      }

      const images = await pickImages({
        maxSelection: allowMultiple ? remainingSlots : 1,
        allowsMultipleSelection: allowMultiple,
      });

      if (images.length > 0) {
        if (supportsMultipleImages) {
          // Append to existing attachments
          const newAttachments = [...attachments, ...images].slice(0, maxSelection);
          setAttachments(newAttachments);
          
          // For Kling O1, auto-add @Image mentions to prompt
          if (isKlingO1) {
            const startIndex = attachments.length + 1;
            const mentions = images.map((_, i) => `@Image${startIndex + i}`).join(" ");
            setPrompt((prev) => {
              if (prev.trim()) {
                return `${prev} ${mentions} `;
              }
              return `${mentions} `;
            });
          }
        } else {
          // Replace single image
          setAttachments(images.slice(0, 1));
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to pick images";
      Alert.alert("Error", message);
    }
  };

  // Handle asset selection
  const handleSelectFromAssets = (selectedImages: { url: string; uri: string }[]) => {
    if (selectedImages.length === 0) return;

    const model = getModelById(selectedModelId);
    const maxSelection = model?.maxAttachments ?? 10;

    // Convert asset URLs to SelectedImage format
    const newImages: SelectedImage[] = selectedImages.map((img) => ({
      uri: img.url,
      url: img.url,
      width: 0,
      height: 0,
      isFromAssets: true,
    } as SelectedImage & { url?: string; isFromAssets?: boolean }));

    if (supportsMultipleImages) {
      // Append to existing attachments
      const newAttachments = [...attachments, ...newImages].slice(0, maxSelection);
      setAttachments(newAttachments);
      
      // For Kling O1, auto-add @Image mentions to prompt
      if (isKlingO1) {
        const startIndex = attachments.length + 1;
        const mentions = newImages.map((_, i) => `@Image${startIndex + i}`).join(" ");
        setPrompt((prev) => {
          if (prev.trim()) {
            return `${prev} ${mentions} `;
          }
          return `${mentions} `;
        });
      }
    } else {
      // Replace single image
      setAttachments(newImages.slice(0, 1));
    }
  };

  // Generate image count options based on model's maxImages
  const maxImagesForModel = getMaxImages(selectedModelId);
  const imageCountOptions = Array.from({ length: maxImagesForModel }, (_, i) => i + 1);
  const imageCountActions = imageCountOptions.map((count) => ({
    id: count.toString(),
    title: `${count} ${count === 1 ? "Image" : "Images"}`,
    image: "photo",
    imageColor: "#ffffff",
  }));

  const handleImageCountAction = (event: { nativeEvent: { event: string } }) => {
    const count = parseInt(event.nativeEvent.event, 10);
    setNumberOfImages(count);
  };

  // Remove attachment
  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle generation
  const handleGenerate = async () => {
    const promptSnapshot = prompt.trim();

    if (!promptSnapshot) {
      Alert.alert("Error", "Please enter a prompt");
      return;
    }

    if (requiresAttachment && attachments.length === 0) {
      Alert.alert("Error", `${currentModel?.label} requires at least one image`);
      return;
    }

    if (credits < estimatedCost) {
      Alert.alert("Insufficient Credits", `You need ${estimatedCost} credits but have ${credits}`);
      return;
    }

    Keyboard.dismiss();

    // Snapshot what the user is generating so the in-flight skeleton doesn't change
    // when the prompt bar is edited mid-generation.
    const effectiveModelId = getEffectiveModelId(selectedModelId, attachments.length > 0);
    const effectiveModel = getModelById(effectiveModelId);
    setPendingGenerationPreview({
      prompt: promptSnapshot,
      modelLabel: effectiveModel?.label ?? selectedModelLabel,
      aspectRatio: selectedAspectRatio,
      numImages: numberOfImages,
    });

    try {
      let attachmentUrls: Array<{ url: string }> | undefined;

      // Upload attachments if any
      if (attachments.length > 0) {
        setIsUploadingAttachments(true);
        const token = await getToken();
        if (!token) {
          throw new Error("Authentication required");
        }

        // Separate asset images (already have URLs) from gallery images (need upload)
        const assetImages = attachments.filter((a) => a.isFromAssets && a.url);
        const galleryImages = attachments.filter((a) => !a.isFromAssets || !a.url);

        // Upload gallery images
        let uploadedUrls: Array<{ url: string }> = [];
        if (galleryImages.length > 0) {
          const uploaded = await uploadAttachments(
            token,
            galleryImages.map((a) => a.uri)
          );
          uploadedUrls = uploaded.map((u) => ({ url: u.url }));
        }

        // Combine asset URLs (in order) with uploaded URLs
        // Maintain original order by rebuilding the array
        attachmentUrls = attachments.map((a) => {
          if (a.isFromAssets && a.url) {
            return { url: a.url };
          }
          // Find the uploaded URL for this gallery image
          const galleryIndex = galleryImages.indexOf(a);
          return uploadedUrls[galleryIndex];
        });

        setIsUploadingAttachments(false);
      }

      // Start generation
      const result = await generate({
        prompt: promptSnapshot,
        modelId: effectiveModelId,
        aspectRatio: selectedAspectRatio,
        numImages: numberOfImages,
        attachmentImages: attachmentUrls,
        resolution: supportsResolution ? selectedResolution : undefined,
        quality: supportsQuality ? selectedQuality : undefined,
        sessionId: currentSessionId,
        onSessionId: (sessionId) => {
          setCurrentSessionId((prev) => prev ?? sessionId);
        },
      });

      if (result.success) {
        // Update session if new one was created
        if (result.sessionId && !currentSessionId) {
          setCurrentSessionId(result.sessionId);
        }
        setPendingGenerationPreview(null);
      } else {
        setPendingGenerationPreview(null);
        Alert.alert("Generation Failed", result.error || "Unknown error");
      }
    } catch (error) {
      setIsUploadingAttachments(false);
      setPendingGenerationPreview(null);
      const message = error instanceof Error ? error.message : "Generation failed";
      Alert.alert("Error", message);
    }
  };

  // Validate Kling O1 @Image mentions
  const klingO1Validation = isKlingO1 
    ? validateKlingO1Prompt(prompt, attachments.length)
    : { valid: true };

  // Check if generate button should be enabled
  const canGenerate =
    prompt.trim().length > 0 &&
    !isUploadingAttachments &&
    credits >= estimatedCost &&
    (!requiresAttachment || attachments.length > 0) &&
    klingO1Validation.valid;

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
          contentContainerStyle={(!currentSessionId || !generations || generations.length === 0) && !isGenerating ? { alignItems: 'center', justifyContent: 'center', flexGrow: 1, paddingBottom: 280 } : { paddingHorizontal: 20, paddingTop: 70, paddingBottom: 280 }}
          showsVerticalScrollIndicator={false}
          bounces={true}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
        >
          {isLoadingGenerations && !pendingGenerationPreview ? (
            <View className="items-center justify-center py-20">
              <ActivityIndicator size="large" color="#a855f7" />
              <Text className="text-gray-500 text-sm mt-3">Loading...</Text>
            </View>
          ) : (pendingGenerationPreview || isGenerating) && (!generations || generations.length === 0) ? (
            // Show skeleton when generating in a new session (no generations yet)
            <View>
              {/* Prompt preview */}
              <View className="bg-neutral-800 rounded-3xl px-4 py-3 mb-2 self-end" style={{ maxWidth: '90%' }}>
                <Text className="text-white text-base text-center" numberOfLines={7}>
                  {pendingGenerationPreview?.prompt ?? prompt}
                </Text>
              </View>
              {/* Model Badge */}
              <View className="flex-row items-center justify-end mb-3">
                <View className="flex-row items-center bg-neutral-800 rounded-full px-3 py-1.5">
                  <Ionicons name="image-outline" size={14} color="#fff" />
                  <Text className="text-white text-xs ml-1.5">
                    {pendingGenerationPreview?.modelLabel ?? selectedModelLabel}
                  </Text>
                </View>
              </View>
              {/* Generation Header */}
              <View className="flex-row items-center mb-3">
                <Image
                  source={require("../../assets/logo.png")}
                  style={{ width: 32, height: 32 }}
                  contentFit="contain"
                />
                <ShimmerText text="Generating..." />
              </View>
              {/* Skeleton */}
              {(pendingGenerationPreview?.numImages ?? numberOfImages) === 1 ? (
                <AutoSkeletonView 
                  isLoading={true} 
                  defaultRadius={16}
                  gradientColors={["#1a1a1a", "#2a2a2a"]}
                >
                  <View
                    style={{ 
                      width: IMAGE_WIDTH, 
                      height: Math.min(
                        IMAGE_WIDTH / parseAspectRatio(pendingGenerationPreview?.aspectRatio ?? selectedAspectRatio),
                        IMAGE_WIDTH * 1.3
                      ), 
                      backgroundColor: "#1a1a1a", 
                      borderRadius: 16 
                    }}
                  />
                </AutoSkeletonView>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  scrollEnabled={false}
                  contentContainerStyle={{ paddingHorizontal: 20 }}
                >
                  {Array.from({ length: pendingGenerationPreview?.numImages ?? numberOfImages }).map((_, idx) => (
                    <AutoSkeletonView 
                      key={idx}
                      isLoading={true} 
                      defaultRadius={16}
                      gradientColors={["#1a1a1a", "#2a2a2a"]}
                    >
                      <View
                        style={{
                          width: MULTI_IMAGE_WIDTH,
                          height: MULTI_IMAGE_WIDTH / parseAspectRatio(pendingGenerationPreview?.aspectRatio ?? selectedAspectRatio),
                          backgroundColor: "#1a1a1a",
                          borderRadius: 16,
                          marginRight: 12,
                        }}
                      />
                    </AutoSkeletonView>
                  ))}
                </ScrollView>
              )}
            </View>
          ) : !currentSessionId || !generations || generations.length === 0 ? (
            <>
              <Image 
                source={require("../../assets/imgnewgrad.png")} 
                style={{ width: 52, height: 52, borderRadius: 12, marginBottom: 8 }}
                contentFit="cover"
              />
              <Text className="text-white text-sm font-medium">Image</Text>
            </>
          ) : (
            generations.map((gen: any, index: number) => {
              const images = gen.images || [];
              const hasMultipleImages = images.length > 1;
              const isLoadingGen = gen.isLoading;
              const genAspectRatio = parseAspectRatio(gen.aspectRatio || selectedAspectRatio);
              const numImages = gen.numImages || 1;
              // For single images, cap height to prevent very tall portraits taking whole screen
              const rawHeight = IMAGE_WIDTH / genAspectRatio;
              const imageHeight = numImages === 1 ? Math.min(rawHeight, IMAGE_WIDTH * 1.3) : rawHeight;
              
              return (
                <View key={gen._id} className={index < generations.length - 1 ? "mb-6" : ""}>
                  {/* Prompt Text at TOP - Right aligned */}
                  {gen.prompt && (
                    <View className="bg-neutral-800 rounded-3xl px-4 py-3 mb-2 self-end" style={{ maxWidth: '90%' }}>
                      <Text className="text-white text-base text-center" numberOfLines={7}>
                        {gen.prompt}
                      </Text>
                    </View>
                  )}

                  {/* Model Badge - Right aligned */}
                  <View className="flex-row items-center justify-end mb-3">
                    <View className="flex-row items-center bg-neutral-800 rounded-full px-3 py-1.5">
                      <Ionicons name="image-outline" size={14} color="#fff" />
                      <Text className="text-white text-xs ml-1.5">{gen.modelLabel || selectedModelLabel}</Text>
                    </View>
                  </View>

                  {/* Generation Header - Logo on left */}
                  <View className="flex-row items-center mb-3">
                    <Image
                      source={require("../../assets/logo.png")}
                      style={{ width: 32, height: 32 }}
                      contentFit="contain"
                    />
                    {isLoadingGen ? (
                      <ShimmerText text="Generating..." />
                    ) : (
                      <Text className="text-gray-400 text-sm ml-2">
                        Generated at {formatTime(gen.completedAt || gen.createdAt)}
                      </Text>
                    )}
                  </View>

                  {/* Images or Loading Skeleton - layered for smooth transition */}
                  {images.length === 0 && !isLoadingGen ? (
                    <View
                      className="rounded-2xl items-center justify-center"
                      style={{ width: IMAGE_WIDTH, height: imageHeight, backgroundColor: "#1a1a1a" }}
                    >
                      {gen.error ? (
                        <>
                          <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
                          <Text className="text-red-400 text-sm mt-2 text-center px-4">{gen.error}</Text>
                        </>
                      ) : (
                        <Ionicons name="image-outline" size={48} color="#4b5563" />
                      )}
                    </View>
                  ) : numImages === 1 || images.length === 1 ? (
                    <View style={{ width: IMAGE_WIDTH, height: imageHeight }}>
                      {/* Skeleton as background - only render while loading */}
                      {isLoadingGen && (
                        <AutoSkeletonView 
                          isLoading={true} 
                          defaultRadius={16}
                          gradientColors={["#1a1a1a", "#2a2a2a"]}
                        >
                          <View
                            style={{ width: IMAGE_WIDTH, height: imageHeight, backgroundColor: "#1a1a1a", borderRadius: 16 }}
                          />
                        </AutoSkeletonView>
                      )}
                      {/* Image overlaid on top when ready */}
                      {images.length > 0 && (
                        <Animated.View 
                          entering={FadeIn.duration(400)}
                          style={{ position: 'absolute', top: 0, left: 0 }}
                        >
                          <Pressable 
                            onPress={() => {
                              setSelectedImage({
                                url: images[0].url,
                                prompt: gen.prompt,
                                model: gen.modelLabel || selectedModelLabel,
                                aspectRatio: gen.aspectRatio || selectedAspectRatio,
                                createdAt: gen.completedAt || gen.createdAt,
                              });
                              imageDetailSheetRef.current?.present();
                            }}
                            className="rounded-2xl overflow-hidden active:opacity-90" 
                            style={{ width: IMAGE_WIDTH }}
                          >
                            <Image
                              source={images[0].url}
                              style={{ width: IMAGE_WIDTH, height: imageHeight }}
                              contentFit="cover"
                              cachePolicy="memory-disk"
                            />
                          </Pressable>
                        </Animated.View>
                      )}
                    </View>
                  ) : (
                    <View style={{ height: MULTI_IMAGE_WIDTH / genAspectRatio }}>
                      {/* Multi-image skeleton as background */}
                      {isLoadingGen && (
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          snapToInterval={MULTI_IMAGE_WIDTH + 12}
                          decelerationRate="fast"
                          style={{ marginHorizontal: -20 }}
                          contentContainerStyle={{ paddingHorizontal: 20 }}
                        >
                          {Array.from({ length: numImages }).map((_, idx) => (
                            <AutoSkeletonView 
                              key={idx}
                              isLoading={true} 
                              defaultRadius={16}
                              gradientColors={["#1a1a1a", "#2a2a2a"]}
                            >
                              <View
                                style={{ 
                                  width: MULTI_IMAGE_WIDTH, 
                                  height: MULTI_IMAGE_WIDTH / genAspectRatio, 
                                  backgroundColor: "#1a1a1a",
                                  borderRadius: 16,
                                  marginRight: 12,
                                }}
                              />
                            </AutoSkeletonView>
                          ))}
                        </ScrollView>
                      )}
                      {/* Multi-image gallery overlaid when ready */}
                      {images.length > 1 && (
                        <Animated.View 
                          entering={FadeIn.duration(400)}
                          style={{ position: 'absolute', top: 0, left: 0, right: 0 }}
                        >
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
                                    model: gen.modelLabel || selectedModelLabel,
                                    aspectRatio: gen.aspectRatio || selectedAspectRatio,
                                    createdAt: gen.completedAt || gen.createdAt,
                                  });
                                  imageDetailSheetRef.current?.present();
                                }}
                                className="rounded-2xl overflow-hidden mr-3 active:opacity-90"
                                style={{ width: MULTI_IMAGE_WIDTH }}
                              >
                                <Image
                                  source={img.url}
                                  style={{ width: MULTI_IMAGE_WIDTH, height: MULTI_IMAGE_WIDTH / genAspectRatio }}
                                  contentFit="cover"
                                  cachePolicy="memory-disk"
                                />
                              </Pressable>
                            ))}
                          </ScrollView>
                        </Animated.View>
                      )}
                    </View>
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
                    <Pressable 
                      className="flex-row items-center active:opacity-70"
                      disabled={savingGenerationId === gen._id}
                      onPress={async () => {
                        if (images.length === 0 || savingGenerationId) return;
                        
                        try {
                          // Request permission
                          const { status } = await MediaLibrary.requestPermissionsAsync();
                          if (status !== 'granted') {
                            Alert.alert(
                              'Permission Required',
                              'Please allow access to save images to your photo library.',
                              [
                                { text: 'Cancel', style: 'cancel' },
                                { text: 'Open Settings', onPress: () => Linking.openSettings() }
                              ]
                            );
                            return;
                          }
                          
                          setSavingGenerationId(gen._id);
                          
                          // Download all images in parallel
                          const batchTimestamp = Date.now();
                          const savePromises = images.map(async (img: any, idx: number) => {
                            const filename = `nsketch_${batchTimestamp}_${idx}.jpg`;
                            const fileUri = FileSystem.cacheDirectory + filename;
                            const downloadResult = await FileSystem.downloadAsync(img.url, fileUri);
                            await MediaLibrary.saveToLibraryAsync(downloadResult.uri);
                          });
                          
                          await Promise.all(savePromises);
                          const savedCount = images.length;
                          
                          setSavingGenerationId(null);
                          
                          if (Platform.OS === 'ios') {
                            Alert.alert('Saved', `${savedCount} image${savedCount > 1 ? 's' : ''} saved to Photos`);
                          } else {
                            ToastAndroid.show(`${savedCount} image${savedCount > 1 ? 's' : ''} saved`, ToastAndroid.SHORT);
                          }
                        } catch (error) {
                          setSavingGenerationId(null);
                          console.error('Download error:', error);
                          Alert.alert('Error', 'Failed to save image(s)');
                        }
                      }}
                    >
                      {savingGenerationId === gen._id ? (
                        <ActivityIndicator size="small" color="#9ca3af" />
                      ) : (
                        <Ionicons name="download-outline" size={16} color="#9ca3af" />
                      )}
                      <Text className="text-gray-400 text-sm ml-1">
                        {savingGenerationId === gen._id 
                          ? 'Saving...' 
                          : images.length > 1 
                            ? 'Download All' 
                            : 'Download'}
                      </Text>
                    </Pressable>
                  </ScrollView>
                </View>
              );
            })
          )}
        </Animated.ScrollView>

        {/* Prompt Bar at Bottom */}
        <Animated.View style={[{ position: 'absolute', bottom: 90, left: 12, right: 12 }, promptBarStyle]}>
          <View>
          <BlurView 
            intensity={80} 
            tint="dark"
            style={{ 
              borderRadius: 24,
              overflow: 'hidden',
            }}
          >
            <View className="pt-3 pb-3 px-4" style={{ backgroundColor: 'rgba(30, 30, 30, 0.7)' }}>
              {/* Attachments Preview - Above TextInput */}
              <Animated.View style={attachmentsAnimatedStyle}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                  {attachments.map((attachment, index) => (
                    <View key={index} className="mr-2 relative">
                      <Image
                        source={attachment.uri}
                        style={{ width: 60, height: 60, borderRadius: 8 }}
                        contentFit="cover"
                      />
                      {/* Show @Image index for Kling O1 */}
                      {isKlingO1 && (
                        <View 
                          className="absolute bottom-1 left-1 rounded px-1.5 py-0.5"
                          style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
                        >
                          <Text className="text-white text-[10px] font-medium">
                            @Image{index + 1}
                          </Text>
                        </View>
                      )}
                      <Pressable
                        onPress={() => removeAttachment(index)}
                        className="absolute rounded-full w-5 h-5 items-center justify-center"
                        style={{ backgroundColor: "rgba(0,0,0,0.7)", top: 2, right: 2 }}
                      >
                        <Ionicons name="close" size={12} color="#fff" />
                      </Pressable>
                    </View>
                  ))}
                </ScrollView>
              </Animated.View>

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
                  <Text className="text-white text-xs mr-1">{selectedModelLabel}</Text>
                  <Ionicons name="chevron-down" size={12} color="#fff" />
                </Pressable>
                {!isAspectRatioDisabled(selectedModelId) && (
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
                          width: selectedAspectRatio === "9:16" || selectedAspectRatio === "3:4" ? 8 : selectedAspectRatio === "1:1" ? 11 : 14,
                          height: selectedAspectRatio === "16:9" || selectedAspectRatio === "4:3" ? 8 : selectedAspectRatio === "1:1" ? 11 : 14,
                          borderWidth: 1.5,
                          borderColor: "#fff",
                          borderRadius: 2,
                          marginRight: 5,
                        }}
                      />
                      <Text className="text-white text-xs">{selectedAspectRatio}</Text>
                    </Pressable>
                  </MenuView>
                )}
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
                {!isAttachmentDisabled(selectedModelId) && (
                  <MenuView
                    title="Select Image Source"
                    onPressAction={handleImageSourceMenuAction}
                    actions={[
                      { id: "assets", title: "Assets", image: "folder", imageColor: "#ffffff" },
                      { id: "gallery", title: "Phone Gallery", image: "photo.on.rectangle", imageColor: "#ffffff" },
                    ]}
                  >
                    <Pressable className="rounded-full p-2 mr-2 active:opacity-70" style={{ backgroundColor: "#3a3a3a" }}>
                      <Ionicons name="add" size={20} color="#fff" />
                    </Pressable>
                  </MenuView>
                )}
                {/* Generate Button - same size as + button */}
                <Pressable
                  onPress={handleGenerate}
                  disabled={!canGenerate}
                  className="active:opacity-70"
                  style={{ 
                    opacity: canGenerate ? 1 : 0.5,
                    borderRadius: 22,
                    overflow: 'hidden',
                  }}
                >
                  {isUploadingAttachments ? (
                    <ActivityIndicator size="small" color="#a855f7" />
                  ) : (
                    <Image
                      source={require("../../assets/genbutton.png")}
                      style={{ width: 36, height: 36 }}
                      contentFit="contain"
                    />
                  )}
                </Pressable>
              </View>
            </View>

            {/* Kling O1 Validation Error */}
            {isKlingO1 && !klingO1Validation.valid && (
              <View className="mt-2 flex-row items-center">
                <Ionicons name="warning-outline" size={14} color="#f59e0b" />
                <Text className="text-amber-500 text-xs ml-1">
                  {klingO1Validation.message}
                </Text>
              </View>
            )}
          </View>
          </BlurView>
          <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 24, borderWidth: 0.5, borderColor: 'rgba(255, 255, 255, 0.2)', zIndex: 10 }} />
          </View>
        </Animated.View>
      </SafeAreaView>

      {/* Model Selector Bottom Sheet */}
      <ModelSelectorSheet 
        ref={modelSheetRef} 
        selectedModelId={selectedModelId}
        onSelectModel={(modelId, modelLabel) => {
          setSelectedModelId(modelId);
          setSelectedModelLabel(modelLabel);
          // Reset aspect ratio if not supported by new model
          const newAllowedRatios = getModelAspectRatios(modelId);
          if (!newAllowedRatios.includes(selectedAspectRatio)) {
            setSelectedAspectRatio(newAllowedRatios[0]);
          }
          // Reset numberOfImages if it exceeds new model's max
          const newMaxImages = getMaxImages(modelId);
          if (numberOfImages > newMaxImages) {
            setNumberOfImages(newMaxImages);
          }
          // Clear attachments when switching to attachment-disabled model
          if (isAttachmentDisabled(modelId)) {
            setAttachments([]);
          }
          // Reset resolution if switching to model with different options
          const newResOptions = getResolutionOptions(modelId);
          if (newResOptions && !newResOptions.includes(selectedResolution)) {
            setSelectedResolution(newResOptions[0]);
          }
        }} 
      />

      {/* Generated Image Detail Sheet */}
      <GeneratedImageSheet
        ref={imageDetailSheetRef}
        image={selectedImage}
        onClose={() => setSelectedImage(null)}
      />

      {/* Asset Picker Sheet */}
      <AssetPickerSheet
        ref={assetPickerSheetRef}
        maxSelection={currentModel?.maxAttachments ?? 10}
        allowMultiple={supportsMultipleImages}
        onSelectImages={handleSelectFromAssets}
        onClose={() => {}}
      />
      </View>
    </SessionsDrawer>
  );
}

