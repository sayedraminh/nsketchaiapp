import React, { useState, useRef, useCallback, useEffect } from "react";
import { View, Text, Pressable, ScrollView, TextInput, Platform, UIManager, Keyboard, Dimensions, ActivityIndicator, Alert, ToastAndroid, Linking } from "react-native";
import { Image } from "expo-image";
import { VideoView, useVideoPlayer } from "expo-video";
import { Video, AVPlaybackStatus, AVPlaybackStatusSuccess, ResizeMode } from "expo-av";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import { BlurView } from "expo-blur";
import { MenuView } from "@react-native-menu/menu";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withRepeat, Easing, useAnimatedScrollHandler, interpolate, FadeIn } from "react-native-reanimated";
import * as Clipboard from "expo-clipboard";
import VideoModelSelectorSheet from "../components/VideoModelSelectorSheet";
import SessionsDrawer, { SessionsDrawerRef } from "../components/SessionsDrawer";
import AssetPickerSheet from "../components/AssetPickerSheet";
import VideoDetailSheet from "../components/VideoDetailSheet";
import { useRoute, RouteProp } from "@react-navigation/native";
import { TabParamList } from "../navigation/TabNavigator";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useCredits } from "../hooks/useCredits";
import { useUser, useAuth } from "@clerk/clerk-expo";
import { useVideoGeneration } from "../hooks/useVideoGeneration";
import {
  VideoModelId,
  VideoAspectRatio,
  VideoDuration,
  VideoResolution,
  getVideoModelById,
  getVideoModelAspectRatios,
  getVideoModelDurations,
  getVideoModelResolutions,
  videoModelRequiresAttachment,
  videoModelSupportsAudio,
  videoModelSupportsFastMode,
  videoModelSupportsCameraFixed,
  videoModelSupportsWatermarkToggle,
  videoModelSupportsTransition,
  isTransitionModel,
  isTextOnlyModel,
  isImageOnlyModel,
  shouldShowResolutionSelector,
  shouldHideAspectRatioWithImage,
  getVideoModelUIConstraints,
  calculateVideoCost,
  DEFAULT_VIDEO_SETTINGS,
} from "../config/videoModels";
import { pickImages, uploadAttachments, SelectedImage } from "../lib/attachments";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import { AutoSkeletonView } from "react-native-auto-skeleton";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const VIDEO_WIDTH = SCREEN_WIDTH - 80;

// Enable LayoutAnimation on Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type VideosScreenRouteProp = RouteProp<TabParamList, "Videos">;

// Spinning icon component for loading state
function SpinningIcon() {
  const rotation = useSharedValue(0);
  
  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 1000, easing: Easing.linear }),
      -1,
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

// Shimmer text component
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

// Parse aspect ratio string to numeric value
function parseAspectRatio(ratio?: string): number {
  if (!ratio) return 16/9;
  const parts = ratio.split(":");
  if (parts.length !== 2) return 16/9;
  const w = parseFloat(parts[0]);
  const h = parseFloat(parts[1]);
  if (isNaN(w) || isNaN(h) || h === 0) return 16/9;
  return w / h;
}

// Video card component that calculates actual aspect ratio from video dimensions
function VideoCard({ uri, containerWidth, onDetailPress }: { uri: string; containerWidth: number; onDetailPress?: () => void }) {
  const [aspectRatio, setAspectRatio] = React.useState(16 / 9); // Default fallback
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const videoRef = React.useRef<Video>(null);

  const height = containerWidth / aspectRatio;

  const handleLoad = (status: AVPlaybackStatus) => {
    if (status.isLoaded && 'uri' in status) {
      // Get natural size from the status if available
      const successStatus = status as AVPlaybackStatusSuccess & { naturalSize?: { width: number; height: number } };
      if (successStatus.naturalSize) {
        const { width, height } = successStatus.naturalSize;
        if (width > 0 && height > 0) {
          setAspectRatio(width / height);
        }
      }
      setIsLoaded(true);
    }
  };

  const handleReadyForDisplay = (event: { naturalSize: { width: number; height: number } }) => {
    const { width, height } = event.naturalSize;
    if (width > 0 && height > 0) {
      setAspectRatio(width / height);
    }
    setIsLoaded(true);
  };

  const handlePlayPress = async () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      await videoRef.current.pauseAsync();
    } else {
      await videoRef.current.playAsync();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <View style={{ width: containerWidth, height, justifyContent: "center", alignItems: "center" }}>
      <Video
        ref={videoRef}
        source={{ uri }}
        style={{ width: containerWidth, height, borderRadius: 16 }}
        resizeMode={ResizeMode.COVER}
        isLooping
        onPlaybackStatusUpdate={handleLoad}
        onReadyForDisplay={handleReadyForDisplay}
      />
      
      {/* Pressable areas around the video to open detail sheet */}
      {onDetailPress && (
        <>
          {/* Top area */}
          <Pressable
            onPress={onDetailPress}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: height * 0.3,
            }}
          />
          {/* Bottom area */}
          <Pressable
            onPress={onDetailPress}
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: height * 0.3,
            }}
          />
          {/* Left area */}
          <Pressable
            onPress={onDetailPress}
            style={{
              position: "absolute",
              top: height * 0.3,
              left: 0,
              width: containerWidth * 0.3,
              height: height * 0.4,
            }}
          />
          {/* Right area */}
          <Pressable
            onPress={onDetailPress}
            style={{
              position: "absolute",
              top: height * 0.3,
              right: 0,
              width: containerWidth * 0.3,
              height: height * 0.4,
            }}
          />
        </>
      )}
      
      {/* Center play/pause button */}
      <Pressable
        onPress={handlePlayPress}
        style={{
          position: "absolute",
          width: 80,
          height: 80,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {!isPlaying && (
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: "rgba(0,0,0,0.6)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons name="play" size={32} color="#fff" />
          </View>
        )}
      </Pressable>
    </View>
  );
}

export default function VideosScreen() {
  const route = useRoute<VideosScreenRouteProp>();
  const { user } = useUser();
  const { getToken } = useAuth();
  const { credits, isLoading: creditsLoading } = useCredits();
  const insets = useSafeAreaInsets();
  
  // Video generation hook
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
  } = useVideoGeneration();
  
  // Track current session
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(undefined);
  const [currentSessionTitle, setCurrentSessionTitle] = useState<string | undefined>(undefined);
  
  // Generation input state
  const [prompt, setPrompt] = useState("");
  const [selectedModelId, setSelectedModelId] = useState<VideoModelId>(settings.modelId);
  const [selectedModelLabel, setSelectedModelLabel] = useState(() => {
    const model = getVideoModelById(settings.modelId);
    return model?.label || "Veo 3.1";
  });
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<VideoAspectRatio>(settings.aspectRatio);
  const [selectedDuration, setSelectedDuration] = useState<VideoDuration>(settings.duration);
  const [selectedResolution, setSelectedResolution] = useState<VideoResolution>(settings.resolution);
  const [generateAudio, setGenerateAudio] = useState(settings.generateAudio);
  const [fastMode, setFastMode] = useState(settings.fastMode);
  const [attachments, setAttachments] = useState<SelectedImage[]>([]);
  const [isUploadingAttachments, setIsUploadingAttachments] = useState(false);
  const [savingGenerationId, setSavingGenerationId] = useState<string | null>(null);
  const [assetPickerFrameIndex, setAssetPickerFrameIndex] = useState<number>(0);

  const [pendingGenerationPreview, setPendingGenerationPreview] = useState<{
    prompt: string;
    modelLabel: string;
    aspectRatio: VideoAspectRatio;
  } | null>(null);
  
  // UI state
  const drawerRef = useRef<SessionsDrawerRef>(null);
  const modelSheetRef = useRef<BottomSheetModal>(null);
  const assetPickerSheetRef = useRef<BottomSheetModal>(null);
  const videoDetailSheetRef = useRef<BottomSheetModal>(null);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
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
  
  // Get current model metadata with dynamic UI constraints
  const currentModel = getVideoModelById(selectedModelId);
  const hasImageAttached = attachments.length > 0;
  
  // Dynamic UI constraints based on model and attachment state
  const uiConstraints = getVideoModelUIConstraints(selectedModelId, hasImageAttached, selectedResolution);
  const requiresAttachment = uiConstraints.requiresImage;
  const supportsAudio = uiConstraints.showAudio;
  const supportsFastMode = videoModelSupportsFastMode(selectedModelId);
  const supportsCameraFixed = uiConstraints.showCameraFixed;
  const supportsWatermarkToggle = uiConstraints.showWatermarkToggle;
  const isTransition = uiConstraints.isTransition;
  const canAttachImage = uiConstraints.canAttachImage;
  
  // Check if we should use transition mode (model supports it AND has 2 frames)
  const currentAttachmentCount = attachments.filter((a) => a !== undefined && a !== null).length;
  const useTransitionMode = videoModelSupportsTransition(selectedModelId) && currentAttachmentCount === 2;
  const showResolution = uiConstraints.showResolution;
  const showAspectRatio = uiConstraints.showAspectRatio;
  const allowedAspectRatios = uiConstraints.aspectRatios;
  const allowedDurations = uiConstraints.durations;
  const allowedResolutions = uiConstraints.resolutions;
  
  // Disable generate button for image-only models without image
  const isImageOnlyWithoutImage = isImageOnlyModel(selectedModelId) && !hasImageAttached;
  const isTextOnlyWithAttachment = isTextOnlyModel(selectedModelId) && hasImageAttached;
  
  const estimatedCost = calculateVideoCost(selectedModelId, {
    resolution: selectedResolution,
    hasAudio: generateAudio,
    duration: selectedDuration,
    fastMode,
  });

  // Sync local state with hook settings when they load from AsyncStorage
  useEffect(() => {
    setSelectedModelId(settings.modelId);
    const model = getVideoModelById(settings.modelId);
    if (model) {
      setSelectedModelLabel(model.label);
    }
    setSelectedAspectRatio(settings.aspectRatio);
    setSelectedDuration(settings.duration);
    setSelectedResolution(settings.resolution);
    setGenerateAudio(settings.generateAudio);
    setFastMode(settings.fastMode);
  }, [settings]);

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

  const getAspectRatioIcon = (ratio: string) => {
    switch (ratio) {
      case "16:9": return "rectangle.ratio.16.to.9";
      case "9:16": return "rectangle.ratio.9.to.16";
      case "1:1": return "square";
      case "4:3": return "rectangle.ratio.4.to.3";
      case "3:4": return "rectangle.portrait";
      default: return "rectangle";
    }
  };

  // Auto-reset aspect ratio and duration when they become invalid for current model/attachment state
  useEffect(() => {
    if (!allowedAspectRatios.includes(selectedAspectRatio)) {
      setSelectedAspectRatio(allowedAspectRatios[0]);
    }
  }, [allowedAspectRatios, selectedAspectRatio]);

  useEffect(() => {
    if (!allowedDurations.includes(selectedDuration)) {
      setSelectedDuration(allowedDurations[0]);
    }
  }, [allowedDurations, selectedDuration]);

  useEffect(() => {
    if (!allowedResolutions.includes(selectedResolution)) {
      setSelectedResolution(allowedResolutions[0]);
    }
  }, [allowedResolutions, selectedResolution]);

  // Clear attachments if model doesn't support them
  useEffect(() => {
    if (!canAttachImage && attachments.length > 0) {
      setAttachments([]);
    }
  }, [canAttachImage]);

  const aspectRatioActions = allowedAspectRatios.map((ratio) => ({
    id: ratio,
    title: ratio,
    image: getAspectRatioIcon(ratio),
    imageColor: "#ffffff",
  }));

  const handleAspectRatioAction = (event: { nativeEvent: { event: string } }) => {
    const ratio = event.nativeEvent.event as VideoAspectRatio;
    if (allowedAspectRatios.includes(ratio)) {
      setSelectedAspectRatio(ratio);
    }
  };

  const durationActions = allowedDurations.map((dur) => ({
    id: dur.toString(),
    title: `${dur}s`,
    image: "timer",
    imageColor: "#ffffff",
  }));

  const handleDurationAction = (event: { nativeEvent: { event: string } }) => {
    const dur = parseInt(event.nativeEvent.event, 10) as VideoDuration;
    setSelectedDuration(dur);
  };

  const resolutionActions = allowedResolutions.map((res) => ({
    id: res,
    title: res,
    image: "tv",
    imageColor: "#ffffff",
  }));

  const handleResolutionAction = (event: { nativeEvent: { event: string } }) => {
    const res = event.nativeEvent.event as VideoResolution;
    setSelectedResolution(res);
  };

  // Handle image source menu action for start frame
  const handleStartFrameMenuAction = async (event: { nativeEvent: { event: string } }) => {
    const action = event.nativeEvent.event;
    if (action === "gallery") {
      handleSelectFromGallery(0);
    } else if (action === "assets") {
      Keyboard.dismiss();
      setAssetPickerFrameIndex(0);
      assetPickerSheetRef.current?.present();
    }
  };

  // Handle image source menu action for end frame
  const handleEndFrameMenuAction = async (event: { nativeEvent: { event: string } }) => {
    const action = event.nativeEvent.event;
    if (action === "gallery") {
      handleSelectFromGallery(1);
    } else if (action === "assets") {
      Keyboard.dismiss();
      setAssetPickerFrameIndex(1);
      assetPickerSheetRef.current?.present();
    }
  };

  // Handle gallery selection
  const handleSelectFromGallery = async (frameIndex: number) => {
    try {
      const images = await pickImages({
        maxSelection: 1,
        allowsMultipleSelection: false,
      });

      if (images.length > 0) {
        setAttachments((prev) => {
          const newAttachments = [...prev];
          newAttachments[frameIndex] = images[0];
          return newAttachments;
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to pick images";
      Alert.alert("Error", message);
    }
  };

  // Handle asset selection
  const handleSelectFromAssets = (selectedImages: { url: string; uri: string }[]) => {
    if (selectedImages.length === 0) return;

    const newImage: SelectedImage = {
      uri: selectedImages[0].url,
      url: selectedImages[0].url,
      width: 0,
      height: 0,
      isFromAssets: true,
    } as SelectedImage & { url?: string; isFromAssets?: boolean };

    setAttachments((prev) => {
      const newAttachments = [...prev];
      newAttachments[assetPickerFrameIndex] = newImage;
      return newAttachments;
    });
  };

  // Remove attachment
  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle video click to show detail sheet
  const handleVideoClick = useCallback((gen: any) => {
    const videos = gen.videos || [];
    const videoUrl = typeof videos[0] === 'string' ? videos[0] : videos[0]?.url;
    
    setSelectedVideo({
      ...gen,
      videoUrl,
      thumbnailUrl: gen.thumbnailUrl,
    });
    videoDetailSheetRef.current?.present();
  }, []);

  // Handle video delete
  const handleDeleteVideo = useCallback((video: any) => {
    // TODO: Implement delete video mutation
    console.log("Delete video:", video._id);
  }, []);

  // Handle generation
  const handleGenerate = async () => {
    const promptSnapshot = prompt.trim();

    if (!promptSnapshot) {
      Alert.alert("Error", "Please enter a prompt");
      return;
    }

    // Count valid attachments (filter out undefined/null)
    const validAttachments = attachments.filter((a) => a !== undefined && a !== null);

    if (requiresAttachment && validAttachments.length === 0) {
      Alert.alert("Error", `${currentModel?.label} requires at least one image`);
      return;
    }

    if (isTransition && validAttachments.length !== 2) {
      Alert.alert("Error", `${currentModel?.label} requires exactly 2 images (start and end frames)`);
      return;
    }

    if (credits < estimatedCost) {
      Alert.alert("Insufficient Credits", `You need ${estimatedCost} credits but have ${credits}`);
      return;
    }

    Keyboard.dismiss();

    // Snapshot what the user is generating so the in-flight skeleton doesn't change
    // when the prompt bar is edited mid-generation.
    setPendingGenerationPreview({
      prompt: promptSnapshot,
      modelLabel: selectedModelLabel,
      aspectRatio: selectedAspectRatio,
    });

    try {
      let attachmentImageUrl: string | undefined;
      let startFrameImageUrl: string | undefined;
      let endFrameImageUrl: string | undefined;

      // Upload attachments if any
      const validAttachments = attachments.filter((a) => a !== undefined && a !== null);
      if (validAttachments.length > 0) {
        setIsUploadingAttachments(true);
        const token = await getToken();
        if (!token) {
          throw new Error("Authentication required");
        }

        // Separate asset images from gallery images
        const assetImages = validAttachments.filter((a) => a.isFromAssets && a.url);
        const galleryImages = validAttachments.filter((a) => !a.isFromAssets || !a.url);

        // Upload gallery images
        let uploadedUrls: string[] = [];
        if (galleryImages.length > 0) {
          const uploaded = await uploadAttachments(
            token,
            galleryImages.map((a) => a.uri)
          );
          uploadedUrls = uploaded.map((u) => u.url);
        }

        // Build attachment URLs in order
        const allUrls: string[] = validAttachments.map((a) => {
          if (a.isFromAssets && a.url) {
            return a.url;
          }
          const galleryIndex = galleryImages.indexOf(a);
          return uploadedUrls[galleryIndex];
        });

        // Use transition mode if model supports it and has 2 frames
        if (useTransitionMode && allUrls.length === 2) {
          startFrameImageUrl = allUrls[0];
          endFrameImageUrl = allUrls[1];
        } else if (allUrls.length > 0) {
          // For kling-o1-transition, always use startFrameImageUrl (backend requires it)
          if (selectedModelId === "kling-o1-transition") {
            startFrameImageUrl = allUrls[0];
          } else {
            attachmentImageUrl = allUrls[0];
          }
        }

        setIsUploadingAttachments(false);
      }

      // Start generation
      const result = await generate({
        prompt: promptSnapshot,
        modelId: selectedModelId,
        aspectRatio: selectedAspectRatio,
        duration: selectedDuration,
        resolution: selectedResolution,
        generateAudio: supportsAudio ? generateAudio : undefined,
        fastMode: supportsFastMode ? fastMode : undefined,
        attachmentImageUrl,
        startFrameImageUrl,
        endFrameImageUrl,
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

  // Check if generate button should be enabled
  const validAttachmentCount = attachments.filter((a) => a !== undefined && a !== null).length;
  const canGenerate =
    prompt.trim().length > 0 &&
    !isUploadingAttachments &&
    credits >= estimatedCost &&
    (!requiresAttachment || validAttachmentCount > 0) &&
    (!isTransition || validAttachmentCount === 2);

  return (
    <SessionsDrawer ref={drawerRef} currentScreen="video">
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

        {/* Static Header */}
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
            // Show skeleton when generating in a new session
            <View>
              <View className="bg-neutral-800 rounded-3xl px-4 py-3 mb-2 self-end" style={{ maxWidth: '90%' }}>
                <Text className="text-white text-base text-center" numberOfLines={7}>
                  {pendingGenerationPreview?.prompt ?? prompt}
                </Text>
              </View>
              <View className="flex-row items-center justify-end mb-3">
                <View className="flex-row items-center bg-neutral-800 rounded-full px-3 py-1.5">
                  <Ionicons name="videocam-outline" size={14} color="#fff" />
                  <Text className="text-white text-xs ml-1.5">
                    {pendingGenerationPreview?.modelLabel ?? selectedModelLabel}
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center mb-3">
                <Image
                  source={require("../../assets/logo.png")}
                  style={{ width: 32, height: 32 }}
                  contentFit="contain"
                />
                <ShimmerText text="Generating video..." />
              </View>
              <AutoSkeletonView 
                isLoading={true} 
                defaultRadius={16}
                gradientColors={["#1a1a1a", "#2a2a2a"]}
              >
                <View
                  style={{ 
                    width: VIDEO_WIDTH, 
                    height: VIDEO_WIDTH / parseAspectRatio(selectedAspectRatio), 
                    backgroundColor: "#1a1a1a", 
                    borderRadius: 16 
                  }}
                />
              </AutoSkeletonView>
            </View>
          ) : !currentSessionId || !generations || generations.length === 0 ? (
            <>
              <Image 
                source={require("../../assets/vidnewgrad.png")} 
                style={{ width: 52, height: 52, borderRadius: 12, marginBottom: 8 }}
                contentFit="cover"
              />
              <Text className="text-white text-sm font-medium">Video</Text>
            </>
          ) : (
            generations.map((gen: any, index: number) => {
              const videos = gen.videos || [];
              // Detect stale loading state (loading for > 10 minutes = likely failed)
              const isStaleLoading = gen.isLoading && gen.createdAt && (Date.now() - gen.createdAt > 10 * 60 * 1000);
              const isLoadingGen = gen.isLoading && !isStaleLoading;
              // Get aspect ratio: use model's fixed ratio if available, else stored ratio, else selected
              const genModelId = gen.modelId as VideoModelId | undefined;
              const genModel = genModelId ? getVideoModelById(genModelId) : null;
              const modelFixedRatio = genModel?.hideAspectRatio ? genModel.allowedAspectRatios[0] : null;
              const genAspectRatio = parseAspectRatio(modelFixedRatio || gen.aspectRatio || selectedAspectRatio);
              const videoHeight = VIDEO_WIDTH / genAspectRatio;
              
              return (
                <View key={gen._id} className={index < generations.length - 1 ? "mb-6" : ""}>
                  {/* Prompt Text */}
                  {gen.prompt && (
                    <View className="bg-neutral-800 rounded-3xl px-4 py-3 mb-2 self-end" style={{ maxWidth: '90%' }}>
                      <Text className="text-white text-base text-center" numberOfLines={7}>
                        {gen.prompt}
                      </Text>
                    </View>
                  )}

                  {/* Model Badge */}
                  <View className="flex-row items-center justify-end mb-3">
                    <View className="flex-row items-center bg-neutral-800 rounded-full px-3 py-1.5">
                      <Ionicons name="videocam-outline" size={14} color="#fff" />
                      <Text className="text-white text-xs ml-1.5">{gen.modelLabel || selectedModelLabel}</Text>
                    </View>
                  </View>

                  {/* Generation Header */}
                  <View className="flex-row items-center mb-3">
                    <Image
                      source={require("../../assets/logo.png")}
                      style={{ width: 32, height: 32 }}
                      contentFit="contain"
                    />
                    {isLoadingGen ? (
                      <ShimmerText text="Generating video..." />
                    ) : (
                      <Text className="text-gray-400 text-sm ml-2">
                        Generated at {formatTime(gen.completedAt || gen.createdAt)}
                      </Text>
                    )}
                  </View>

                  {/* Video or Loading Skeleton */}
                  {videos.length === 0 && !isLoadingGen ? (
                    <View
                      className="rounded-2xl items-center justify-center"
                      style={{ width: VIDEO_WIDTH, height: videoHeight, backgroundColor: "#1a1a1a" }}
                    >
                      {gen.error || isStaleLoading ? (
                        <>
                          <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
                          <Text className="text-red-400 text-sm mt-2 text-center px-4">
                            {gen.error || "Generation timed out. Please try again."}
                          </Text>
                        </>
                      ) : (
                        <Ionicons name="videocam-outline" size={48} color="#4b5563" />
                      )}
                    </View>
                  ) : (
                    <View style={{ width: VIDEO_WIDTH }}>
                      {isLoadingGen && (
                        <AutoSkeletonView 
                          isLoading={true} 
                          defaultRadius={16}
                          gradientColors={["#1a1a1a", "#2a2a2a"]}
                        >
                          <View
                            style={{ width: VIDEO_WIDTH, height: VIDEO_WIDTH, backgroundColor: "#1a1a1a", borderRadius: 16 }}
                          />
                        </AutoSkeletonView>
                      )}
                      {videos.length > 0 && (
                        <View className="rounded-2xl overflow-hidden" style={{ width: VIDEO_WIDTH }}>
                          <VideoCard
                            uri={typeof videos[0] === 'string' ? videos[0] : videos[0].url}
                            containerWidth={VIDEO_WIDTH}
                            onDetailPress={() => handleVideoClick(gen)}
                          />
                        </View>
                      )}
                    </View>
                  )}

                  {/* Action Buttons - Only show when not loading */}
                  {!isLoadingGen && (
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
                    <Pressable 
                      className="flex-row items-center active:opacity-70"
                      disabled={savingGenerationId === gen._id}
                      onPress={async () => {
                        if (videos.length === 0 || savingGenerationId) return;
                        
                        try {
                          const { status } = await MediaLibrary.requestPermissionsAsync();
                          if (status !== 'granted') {
                            Alert.alert(
                              'Permission Required',
                              'Please allow access to save videos to your photo library.',
                              [
                                { text: 'Cancel', style: 'cancel' },
                                { text: 'Open Settings', onPress: () => Linking.openSettings() }
                              ]
                            );
                            return;
                          }
                          
                          setSavingGenerationId(gen._id);
                          
                          const filename = `nsketch_video_${Date.now()}.mp4`;
                          const fileUri = FileSystem.cacheDirectory + filename;
                          const videoUrl = typeof videos[0] === 'string' ? videos[0] : videos[0].url;
                          const downloadResult = await FileSystem.downloadAsync(videoUrl, fileUri);
                          await MediaLibrary.saveToLibraryAsync(downloadResult.uri);
                          
                          setSavingGenerationId(null);
                          
                          if (Platform.OS === 'ios') {
                            Alert.alert('Saved', 'Video saved to Photos');
                          } else {
                            ToastAndroid.show('Video saved', ToastAndroid.SHORT);
                          }
                        } catch (error) {
                          setSavingGenerationId(null);
                          console.error('Download error:', error);
                          Alert.alert('Error', 'Failed to save video');
                        }
                      }}
                    >
                      {savingGenerationId === gen._id ? (
                        <ActivityIndicator size="small" color="#9ca3af" />
                      ) : (
                        <Ionicons name="download-outline" size={16} color="#9ca3af" />
                      )}
                      <Text className="text-gray-400 text-sm ml-1">
                        {savingGenerationId === gen._id ? 'Saving...' : 'Download'}
                      </Text>
                    </Pressable>
                  </ScrollView>
                  )}
                </View>
              );
            })
          )}
        </Animated.ScrollView>

        {/* Prompt Bar at Bottom */}
        <Animated.View style={[{ position: 'absolute', bottom: 90, left: 12, right: 12 }, promptBarStyle]}>
          {/* Start Frame Button - positioned above top-left of prompt bar */}
          {canAttachImage && (
            <View 
              style={{ position: 'absolute', top: -78, left: 15, zIndex: -1, transform: [{ rotate: '-5deg' }] }}
            >
              {!attachments[0] ? (
                <MenuView
                  title="Select the first frame"
                  onPressAction={handleStartFrameMenuAction}
                  actions={[
                    { id: "gallery", title: "Phone Gallery", image: "photo.on.rectangle", imageColor: "#ffffff" },
                    { id: "assets", title: "Assets", image: "folder", imageColor: "#ffffff" },
                  ]}
                >
                  <Pressable className="active:opacity-70">
                    <View>
                      <BlurView
                        intensity={80}
                        tint="dark"
                        style={{
                          borderRadius: 12,
                          overflow: 'hidden',
                        }}
                      >
                        <View 
                          className="items-center justify-center"
                          style={{ backgroundColor: 'rgba(30, 30, 30, 0.7)', width: 64, height: 86, paddingHorizontal: 6 }}
                        >
                          <Ionicons name="add" size={24} color="#9ca3af" />
                          <Text className="text-gray-400 mt-1.5 text-center" style={{ fontSize: 10 }}>Start frame</Text>
                        </View>
                      </BlurView>
                      <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 12, borderWidth: 0.5, borderColor: 'rgba(255, 255, 255, 0.2)', zIndex: 10 }} />
                    </View>
                  </Pressable>
                </MenuView>
              ) : (
                <View 
                  style={{ 
                    padding: 2,
                    backgroundColor: '#ffffff',
                    borderRadius: 14,
                  }}
                  {...(Platform.OS === 'ios' ? { shouldRasterizeIOS: true } : {})}
                  {...(Platform.OS === 'android' ? { renderToHardwareTextureAndroid: true } : {})}
                >
                  <Image
                    source={attachments[0].uri}
                    style={{ width: 60, height: 82, borderRadius: 11 }}
                    contentFit="cover"
                  />
                  <Pressable
                    onPress={() => removeAttachment(0)}
                    className="absolute rounded-full w-5 h-5 items-center justify-center"
                    style={{ backgroundColor: "rgba(80,80,80,0.9)", top: -6, right: -6, zIndex: 20, borderWidth: 2, borderColor: '#ffffff' }}
                  >
                    <Ionicons name="close" size={12} color="#fff" />
                  </Pressable>
                </View>
              )}
            </View>
          )}

          {/* End Frame Button - positioned behind start frame (for transition models) */}
          {videoModelSupportsTransition(selectedModelId) && (
            <View 
              style={{ position: 'absolute', top: -79, left: 79, zIndex: -2, transform: [{ rotate: '1deg' }] }}
            >
              {!attachments[1] ? (
                <MenuView
                  title="Select the end frame"
                  onPressAction={handleEndFrameMenuAction}
                  actions={[
                    { id: "gallery", title: "Phone Gallery", image: "photo.on.rectangle", imageColor: "#ffffff" },
                    { id: "assets", title: "Assets", image: "folder", imageColor: "#ffffff" },
                  ]}
                >
                  <Pressable className="active:opacity-70">
                    <View>
                      <BlurView
                        intensity={80}
                        tint="dark"
                        style={{
                          borderRadius: 12,
                          overflow: 'hidden',
                        }}
                      >
                        <View 
                          className="items-center justify-center"
                          style={{ backgroundColor: 'rgba(30, 30, 30, 0.7)', width: 64, height: 86, paddingHorizontal: 6 }}
                        >
                          <Ionicons name="add" size={24} color="#9ca3af" />
                          <Text className="text-gray-400 mt-1.5 text-center" style={{ fontSize: 10 }}>End frame</Text>
                        </View>
                      </BlurView>
                      <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 12, borderWidth: 0.5, borderColor: 'rgba(255, 255, 255, 0.2)', zIndex: 10 }} />
                    </View>
                  </Pressable>
                </MenuView>
              ) : (
                <View 
                  style={{ 
                    padding: 2.5,
                    backgroundColor: '#ffffff',
                    borderRadius: 14,
                  }}
                  {...(Platform.OS === 'ios' ? { shouldRasterizeIOS: true } : {})}
                  {...(Platform.OS === 'android' ? { renderToHardwareTextureAndroid: true } : {})}
                >
                  <Image
                    source={attachments[1].uri}
                    style={{ width: 60, height: 82, borderRadius: 11 }}
                    contentFit="cover"
                  />
                  <Pressable
                    onPress={() => removeAttachment(1)}
                    className="absolute rounded-full w-5 h-5 items-center justify-center"
                    style={{ backgroundColor: "rgba(80,80,80,0.9)", top: -6, right: -6, zIndex: 20, borderWidth: 2, borderColor: '#ffffff' }}
                  >
                    <Ionicons name="close" size={12} color="#fff" />
                  </Pressable>
                </View>
              )}
            </View>
          )}
          <View style={{ zIndex: 10 }}>
          <BlurView 
            intensity={80} 
            tint="dark"
            style={{ 
              borderRadius: 24,
              overflow: 'hidden',
            }}
          >
            <View className="pt-3 pb-3 px-4" style={{ backgroundColor: 'rgba(30, 30, 30, 0.7)' }}>

              <TextInput
                value={prompt}
                onChangeText={setPrompt}
                placeholder="Describe the video you want to create"
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
                {showAspectRatio && (
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
                  title="Duration"
                  onPressAction={handleDurationAction}
                  actions={durationActions}
                >
                  <Pressable
                    className="flex-row items-center rounded-full px-2.5 mr-2 active:opacity-70"
                    style={{ backgroundColor: "#3a3a3a", height: 28 }}
                  >
                    <Ionicons name="time-outline" size={14} color="#fff" />
                    <Text className="text-white text-xs ml-1.5">{selectedDuration}s</Text>
                  </Pressable>
                </MenuView>
                {allowedResolutions.length > 1 && (
                  <MenuView
                    title="Resolution"
                    onPressAction={handleResolutionAction}
                    actions={resolutionActions}
                  >
                    <Pressable
                      className="flex-row items-center rounded-full px-2.5 mr-2 active:opacity-70"
                      style={{ backgroundColor: "#3a3a3a", height: 28 }}
                    >
                      <Ionicons name="tv-outline" size={14} color="#fff" />
                      <Text className="text-white text-xs ml-1.5">{selectedResolution}</Text>
                    </Pressable>
                  </MenuView>
                )}
                {supportsAudio && (
                  <Pressable
                    onPress={() => setGenerateAudio(!generateAudio)}
                    className="flex-row items-center rounded-full px-2.5 mr-2 active:opacity-70"
                    style={{ 
                      backgroundColor: generateAudio ? "#ffffff" : "#3a3a3a",
                      height: 28
                    }}
                  >
                    <Ionicons 
                      name={generateAudio ? "volume-high" : "volume-mute"} 
                      size={14} 
                      color={generateAudio ? "#000000" : "#ffffff"} 
                    />
                    <Text 
                      className="text-xs ml-1.5"
                      style={{ 
                        color: generateAudio ? "#000000" : "#ffffff",
                        fontWeight: generateAudio ? "600" : "400"
                      }}
                    >
                      {generateAudio ? "Audio On" : "Audio Off"}
                    </Text>
                  </Pressable>
                )}
              </ScrollView>
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 8 }}>
                {/* Generate Button */}
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

          </View>
          </BlurView>
          <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 24, borderWidth: 0.5, borderColor: 'rgba(255, 255, 255, 0.2)', zIndex: 10 }} />
          </View>
        </Animated.View>
      </SafeAreaView>

      {/* Video Model Selector Bottom Sheet */}
      <VideoModelSelectorSheet 
        ref={modelSheetRef} 
        selectedModelId={selectedModelId}
        onSelectModel={(modelId, modelLabel) => {
          setSelectedModelId(modelId);
          setSelectedModelLabel(modelLabel);
          
          const model = getVideoModelById(modelId);
          
          // Reset aspect ratio if not supported by new model
          const newAllowedRatios = getVideoModelAspectRatios(modelId);
          const newAspectRatio = !newAllowedRatios.includes(selectedAspectRatio) 
            ? newAllowedRatios[0] 
            : selectedAspectRatio;
          setSelectedAspectRatio(newAspectRatio);
          
          // Reset duration if not supported
          const newAllowedDurations = getVideoModelDurations(modelId);
          const newDuration = !newAllowedDurations.includes(selectedDuration)
            ? newAllowedDurations[0]
            : selectedDuration;
          setSelectedDuration(newDuration);
          
          // Reset resolution if needed
          const newAllowedResolutions = getVideoModelResolutions(modelId);
          const newResolution = !newAllowedResolutions.includes(selectedResolution)
            ? newAllowedResolutions[0]
            : selectedResolution;
          setSelectedResolution(newResolution);
          
          // Reset audio toggle
          const newGenerateAudio = !!(model?.supportsAudio && model.defaultAudioOn);
          setGenerateAudio(newGenerateAudio);
          
          // Persist all settings to AsyncStorage
          updateSettings({
            modelId,
            aspectRatio: newAspectRatio,
            duration: newDuration,
            resolution: newResolution,
            generateAudio: newGenerateAudio,
            fastMode,
          });
        }} 
      />

      {/* Asset Picker Sheet */}
      <AssetPickerSheet
        ref={assetPickerSheetRef}
        maxSelection={1}
        allowMultiple={false}
        onSelectImages={handleSelectFromAssets}
        onClose={() => {}}
      />

      {/* Video Detail Sheet */}
      <VideoDetailSheet
        ref={videoDetailSheetRef}
        video={selectedVideo}
        onClose={() => setSelectedVideo(null)}
        onDelete={handleDeleteVideo}
      />
      </View>
    </SessionsDrawer>
  );
}

